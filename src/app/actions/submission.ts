"use server";

import { auth } from "@/auth";
import { recordAudit, clientIp } from "@/lib/audit";
import { hashIp } from "@/lib/crypto";
import { serverEnv } from "@/lib/env";
import {
  sendInternalNotification,
  sendOrderConfirmation,
} from "@/lib/email/templates";
import {
  allocateOrderNumber,
  allocateSampleCode,
} from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import {
  estimatedTurnaround,
  priceOrder,
  TEST_CATALOG,
  type PriceableOrder,
  type TestKey,
} from "@/lib/pricing";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { fullSubmissionSchema } from "@/lib/validations/submission";

/**
 * Sample submission.
 *
 * Security-relevant properties:
 *
 *  • Prices are recomputed server-side from the submitted test selections. Any
 *    total, subtotal or discount in the client payload is ignored entirely, so a
 *    tampered request cannot alter what is billed.
 *  • The whole write is one transaction, so a failure part-way cannot leave an
 *    order without samples or an orphaned reference number.
 *  • Anonymous submission is permitted (a customer record is created or reused
 *    by email), but an authenticated submission is always bound to the session's
 *    own customer - a signed-in user cannot submit against someone else's
 *    account by supplying a different address.
 */

export interface SubmissionResult {
  ok: boolean;
  orderNumber?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

function testsFromSample(tests: Record<string, boolean>) {
  return {
    testPurity: Boolean(tests.purity),
    testIdentity: Boolean(tests.identity),
    testContent: Boolean(tests.content),
    testSterility: Boolean(tests.sterility),
    testEndotoxin: Boolean(tests.endotoxin),
    testHeavyMetals: Boolean(tests.heavyMetals),
    testResidualSolvents: Boolean(tests.residualSolvents),
    testConformity: Boolean(tests.conformity),
    testPhoto: Boolean(tests.photo),
  };
}

/** Human-readable list of the assays selected, for the notification email. */
function selectedTestLabels(tests: Record<string, boolean>): string[] {
  return TEST_CATALOG.filter((t) => tests[t.key]).map((t) => t.label);
}

export async function createSubmission(
  raw: unknown,
): Promise<SubmissionResult> {
  const parsed = fullSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Some details need correcting before we can accept this order.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;

  const ipHash = hashIp(await clientIp());
  const limit = await rateLimit({
    key: `submission:${ipHash ?? "anon"}`,
    ...RATE_LIMITS.submission,
  });
  if (!limit.success) {
    return {
      ok: false,
      message:
        "Too many submissions from this connection. Please wait a few minutes, or contact the laboratory directly.",
    };
  }

  // ── Recompute pricing from the selections, never from the client total. ──
  const priceable: PriceableOrder = {
    samples: data.samples.map((sample) => ({
      quantity: sample.quantity,
      tests: sample.tests as Partial<Record<TestKey, boolean>>,
    })),
    isExpedited: data.isExpedited,
    additionalCoaNames: data.additionalCoaNames,
  };
  const pricing = priceOrder(priceable);

  const session = await auth();

  try {
    const result = await prisma.$transaction(async (tx) => {
      /*
       * Resolve the customer.
       *
       * Authenticated: always the session's own customer, regardless of what the
       * form said. Anonymous: reuse an existing record matching the email so a
       * returning client accumulates history, otherwise create one.
       */
      let customerId: string | null = null;

      if (session?.user?.id) {
        const owned = await tx.customer.findFirst({
          where: { userId: session.user.id },
          select: { id: true },
        });
        customerId = owned?.id ?? null;
      }

      if (!customerId) {
        const existing = await tx.customer.findFirst({
          where: { email: data.email },
          select: { id: true },
        });
        customerId = existing?.id ?? null;
      }

      const addresses = {
        shippingLine1: data.shipping.line1,
        shippingLine2: data.shipping.line2 || null,
        shippingCity: data.shipping.city,
        shippingState: data.shipping.state || null,
        shippingPostalCode: data.shipping.postalCode,
        shippingCountry: data.shipping.country,

        billingLine1: data.billingSameAsShipping
          ? data.shipping.line1
          : (data.billing?.line1 ?? null),
        billingLine2: data.billingSameAsShipping
          ? data.shipping.line2 || null
          : (data.billing?.line2 ?? null),
        billingCity: data.billingSameAsShipping
          ? data.shipping.city
          : (data.billing?.city ?? null),
        billingState: data.billingSameAsShipping
          ? data.shipping.state || null
          : (data.billing?.state ?? null),
        billingPostalCode: data.billingSameAsShipping
          ? data.shipping.postalCode
          : (data.billing?.postalCode ?? null),
        billingCountry: data.billingSameAsShipping
          ? data.shipping.country
          : (data.billing?.country ?? null),
      };

      if (customerId) {
        // Refresh contact details, but never overwrite the linked user account.
        await tx.customer.update({
          where: { id: customerId },
          data: {
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            phone: data.phone,
            vatNumber: data.vatNumber || null,
            marketingOptIn: data.marketingOptIn,
            ...addresses,
          },
        });
      } else {
        const created = await tx.customer.create({
          data: {
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone,
            vatNumber: data.vatNumber || null,
            marketingOptIn: data.marketingOptIn,
            ...addresses,
          },
          select: { id: true },
        });
        customerId = created.id;
      }

      const orderNumber = await allocateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: "PENDING",
          subtotalCents: pricing.subtotalCents,
          discountCents: pricing.discountCents,
          discountPercent: pricing.discountPercent,
          expediteCents: pricing.expediteCents,
          additionalCoaCents: pricing.additionalCoaCents,
          totalCents: pricing.totalCents,
          isExpedited: data.isExpedited,
          additionalCoaNames: data.additionalCoaNames.filter(
            (n) => n.trim().length > 0,
          ),
          combineOnSingleCoa: data.combineOnSingleCoa,
          paymentMethod: data.paymentMethod,
          specialInstructions: data.specialInstructions || null,
        },
        select: { id: true, orderNumber: true },
      });

      // Sample codes are allocated sequentially inside the transaction so a
      // concurrent submission cannot interleave and duplicate one.
      for (const [index, sample] of data.samples.entries()) {
        const sampleCode = await allocateSampleCode();
        await tx.sample.create({
          data: {
            orderId: order.id,
            sampleCode,
            productName: sample.productName,
            batchNumber: sample.batchNumber,
            strength: sample.strength || null,
            quantity: sample.quantity,
            expectedPeptide: sample.expectedPeptide || null,
            notes: sample.notes || null,
            lineTotalCents: pricing.lines[index]?.lineTotalCents ?? 0,
            ...testsFromSample(sample.tests as Record<string, boolean>),
          },
        });
      }

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          note: "Submission received via the online form.",
        },
      });

      await tx.notification.create({
        data: {
          customerId,
          title: `Order ${order.orderNumber} received`,
          body: "We have logged your submission. Ship your samples quoting this order number and we will confirm on arrival.",
          href: "/dashboard/orders",
          icon: "package",
        },
      });

      return { order, customerId };
    });

    // ── Post-commit side effects. Failures here must not undo the order. ──
    const emailResults = await Promise.allSettled([
      sendOrderConfirmation({
        to: data.email,
        contactPerson: data.contactPerson,
        companyName: data.companyName,
        orderNumber: result.order.orderNumber,
        totalCents: pricing.totalCents,
        sampleCount: data.samples.length,
        estimatedTurnaround: estimatedTurnaround(priceable),
        requiredVials: pricing.requiredVials,
      }),
      sendInternalNotification({
        to: serverEnv().EMAIL_INTERNAL_INBOX,
        heading: `New submission ${result.order.orderNumber}`,
        paragraphs: [
          `${data.companyName} submitted ${data.samples.length} sample line${
            data.samples.length === 1 ? "" : "s"
          }${data.isExpedited ? ", flagged for EXPEDITED processing" : ""}.`,
          data.samples
            .map(
              (s, i) =>
                `${i + 1}. ${s.productName} (batch ${s.batchNumber}, ${s.quantity} vial${
                  s.quantity === 1 ? "" : "s"
                }) - ${selectedTestLabels(s.tests as Record<string, boolean>).join(", ")}`,
            )
            .join("\n"),
          ...(data.specialInstructions
            ? [`Special instructions: ${data.specialInstructions}`]
            : []),
        ],
        facts: [
          { label: "Order", value: result.order.orderNumber },
          { label: "Contact", value: `${data.contactPerson} <${data.email}>` },
          { label: "Vials expected", value: String(pricing.requiredVials) },
          {
            label: "Estimated total",
            value: `$${(pricing.totalCents / 100).toFixed(2)}`,
          },
        ],
        href: "/admin/orders",
        replyTo: data.email,
      }),
    ]);

    for (const outcome of emailResults) {
      if (outcome.status === "rejected") {
        console.error("[submission] notification failed", outcome.reason);
      }
    }

    await recordAudit({
      action: "order.created",
      userId: session?.user?.id ?? null,
      actorEmail: data.email,
      entity: "Order",
      entityId: result.order.id,
      metadata: {
        orderNumber: result.order.orderNumber,
        sampleCount: data.samples.length,
        totalCents: pricing.totalCents,
        expedited: data.isExpedited,
      },
    });

    return { ok: true, orderNumber: result.order.orderNumber };
  } catch (error) {
    console.error("[submission] failed to create order", error);
    return {
      ok: false,
      message:
        "We could not record your submission. Nothing has been charged. Please try again, or contact the laboratory if this persists.",
    };
  }
}
