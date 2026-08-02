"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, AuthorizationError } from "@/lib/auth-helpers";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sendInvoiceIssued, sendStatusEmail } from "@/lib/email/templates";
import { allocateInvoiceNumber } from "@/lib/ids";
import { orderStatusUpdateSchema } from "@/lib/validations/misc";
import { TEST_CATALOG } from "@/lib/pricing";
import type { OrderStatus, Prisma } from "@prisma/client";

export interface AdminActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

/** Timestamp column set when an order enters a given status. */
const STATUS_TIMESTAMP: Partial<Record<OrderStatus, keyof Prisma.OrderUpdateInput>> =
  {
    ACCEPTED: "acceptedAt",
    SAMPLE_RECEIVED: "receivedAt",
    TESTING: "testingAt",
    COMPLETED: "completedAt",
    SHIPPED: "shippedAt",
  };

/** Notification copy shown in the client portal per status. */
const NOTIFICATION_COPY: Partial<
  Record<OrderStatus, { title: string; body: string }>
> = {
  ACCEPTED: {
    title: "Order accepted",
    body: "The laboratory has accepted your submission. Ship your samples quoting the order number if you have not already.",
  },
  REJECTED: {
    title: "Order not accepted",
    body: "We were unable to proceed with this submission. Open the order to see the reason.",
  },
  SAMPLE_RECEIVED: {
    title: "Samples received",
    body: "Your samples arrived and passed receiving inspection. They are now queued for analysis.",
  },
  TESTING: {
    title: "Analysis started",
    body: "Your samples are now on instrument.",
  },
  AWAITING_RESULTS: {
    title: "In final review",
    body: "Instrumental analysis is complete. Your data is with the reviewing analyst.",
  },
  COMPLETED: {
    title: "Analysis complete",
    body: "Your order is complete. Certificates are released separately once signed.",
  },
  SHIPPED: {
    title: "Return shipment dispatched",
    body: "Retained material and documentation have been dispatched to your address.",
  },
};

/**
 * Moves an order to a new status.
 *
 * Every transition does four things atomically: updates the order, appends an
 * immutable OrderEvent, creates a portal notification, and records the audit
 * entry. The customer email is sent AFTER the transaction commits — a mail
 * provider outage must not roll back a legitimate status change, so the send
 * result is recorded on the event instead.
 */
export async function updateOrderStatus(
  raw: unknown,
): Promise<AdminActionResult> {
  const parsed = orderStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;

  try {
    const admin = await assertAdmin();

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerId: true,
        totalCents: true,
        currency: true,
        customer: {
          select: { email: true, contactPerson: true, companyName: true },
        },
        _count: { select: { samples: true } },
      },
    });

    if (!order) return { ok: false, message: "That order no longer exists." };

    if (order.status === data.status) {
      return {
        ok: false,
        message: `This order is already marked ${data.status.toLowerCase().replace(/_/g, " ")}.`,
      };
    }

    const timestampField = STATUS_TIMESTAMP[data.status];

    const { eventId } = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: data.status,
          ...(timestampField ? { [timestampField]: new Date() } : {}),
          ...(data.status === "REJECTED"
            ? { rejectionReason: data.rejectionReason || null }
            : {}),
          ...(data.trackingCarrier
            ? { trackingCarrier: data.trackingCarrier }
            : {}),
          ...(data.trackingNumber
            ? { trackingNumber: data.trackingNumber }
            : {}),
        },
      });

      const event = await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status: data.status,
          note:
            data.note ||
            (data.status === "REJECTED" ? data.rejectionReason : null) ||
            null,
          createdBy: admin.email,
        },
        select: { id: true },
      });

      const copy = NOTIFICATION_COPY[data.status];
      if (copy) {
        await tx.notification.create({
          data: {
            customerId: order.customerId,
            title: `${copy.title} — ${order.orderNumber}`,
            body: copy.body,
            href: `/dashboard/orders/${order.id}`,
            icon: "package",
          },
        });
      }

      return { eventId: event.id };
    });

    // ── Post-commit notification ──
    const emailResult = await sendStatusEmail(data.status, {
      to: order.customer.email,
      contactPerson: order.customer.contactPerson,
      companyName: order.customer.companyName,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      currency: order.currency,
      sampleCount: order._count.samples,
      reason: data.rejectionReason,
      carrier: data.trackingCarrier,
      trackingNumber: data.trackingNumber,
    });

    if (emailResult) {
      await prisma.orderEvent
        .update({
          where: { id: eventId },
          data: { emailSent: emailResult.ok },
        })
        .catch((error) =>
          console.error("[admin] could not record email status", error),
        );
    }

    await recordAudit({
      action: "order.status_changed",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Order",
      entityId: order.id,
      metadata: {
        from: order.status,
        to: data.status,
        orderNumber: order.orderNumber,
        emailSent: emailResult?.ok ?? null,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/dashboard/orders");

    return {
      ok: true,
      message:
        emailResult && !emailResult.ok
          ? "Status updated, but the notification email could not be sent."
          : "Status updated and the customer has been notified.",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[admin] status update failed", error);
    return { ok: false, message: "Could not update this order." };
  }
}

/** Saves admin-only working notes against an order. */
export async function updateOrderNotes(
  orderId: string,
  notes: string,
): Promise<AdminActionResult> {
  try {
    const admin = await assertAdmin();

    await prisma.order.update({
      where: { id: orderId },
      data: { adminNotes: notes.slice(0, 4000) || null },
    });

    await recordAudit({
      action: "order.notes_updated",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Order",
      entityId: orderId,
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, message: "Notes saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[admin] notes update failed", error);
    return { ok: false, message: "Could not save notes." };
  }
}

/**
 * Generates an invoice from an order.
 *
 * Line items are frozen into the invoice as JSON at creation time, so editing an
 * order or changing the price list later never mutates a historical invoice.
 */
export async function createInvoiceForOrder(
  orderId: string,
): Promise<AdminActionResult> {
  try {
    const admin = await assertAdmin();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        samples: true,
        customer: { select: { id: true, email: true, contactPerson: true } },
        invoices: { select: { id: true } },
      },
    });

    if (!order) return { ok: false, message: "That order no longer exists." };
    if (order.invoices.length > 0) {
      return {
        ok: false,
        message: "An invoice already exists for this order.",
      };
    }

    // Build the frozen line-item snapshot.
    const lineItems: { description: string; amountCents: number }[] = [];

    for (const sample of order.samples) {
      const selected = TEST_CATALOG.filter((test) => {
        const column = {
          purity: sample.testPurity,
          identity: sample.testIdentity,
          content: sample.testContent,
          sterility: sample.testSterility,
          endotoxin: sample.testEndotoxin,
          heavyMetals: sample.testHeavyMetals,
          residualSolvents: sample.testResidualSolvents,
          conformity: sample.testConformity,
          photo: sample.testPhoto,
        }[test.key];
        return column === true;
      });

      for (const test of selected) {
        if (test.priceCents === 0) continue;
        const qty = test.perVial ? sample.quantity : 1;
        lineItems.push({
          description: `${sample.productName} (${sample.batchNumber}) — ${test.label}${qty > 1 ? ` × ${qty}` : ""}`,
          amountCents: test.priceCents * qty,
        });
      }
    }

    if (order.discountCents > 0) {
      lineItems.push({
        description: `Volume discount (${order.discountPercent}%)`,
        amountCents: -order.discountCents,
      });
    }
    if (order.expediteCents > 0) {
      lineItems.push({
        description: "Expedited processing surcharge",
        amountCents: order.expediteCents,
      });
    }
    if (order.additionalCoaCents > 0) {
      lineItems.push({
        description: `Additional COA names (${order.additionalCoaNames.length})`,
        amountCents: order.additionalCoaCents,
      });
    }

    const invoiceNumber = await allocateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerId: order.customerId,
        status: "SENT",
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
        currency: order.currency,
        lineItems: lineItems as unknown as Prisma.InputJsonValue,
        dueDate,
      },
      select: { id: true, invoiceNumber: true, totalCents: true, currency: true },
    });

    await prisma.notification.create({
      data: {
        customerId: order.customerId,
        title: `Invoice ${invoice.invoiceNumber} issued`,
        body: "An invoice has been issued for your order. View it in your portal.",
        href: "/dashboard/invoices",
        icon: "invoice",
      },
    });

    await sendInvoiceIssued({
      to: order.customer.email,
      contactPerson: order.customer.contactPerson,
      invoiceNumber: invoice.invoiceNumber,
      orderNumber: order.orderNumber,
      totalCents: invoice.totalCents,
      currency: invoice.currency,
      dueDate,
    });

    await recordAudit({
      action: "invoice.created",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, orderId: order.id },
    });

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/dashboard/invoices");

    return {
      ok: true,
      message: `Invoice ${invoice.invoiceNumber} issued and emailed.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[admin] invoice creation failed", error);
    return { ok: false, message: "Could not create an invoice." };
  }
}

/** Updates an invoice's status, stamping `paidAt` when marked PAID. */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID",
): Promise<AdminActionResult> {
  try {
    const admin = await assertAdmin();

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        ...(status === "PAID" ? { paidAt: new Date() } : {}),
      },
    });

    await recordAudit({
      action: "invoice.status_changed",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Invoice",
      entityId: invoiceId,
      metadata: { status },
    });

    revalidatePath("/admin/invoices");
    revalidatePath("/dashboard/invoices");
    return { ok: true, message: `Invoice marked ${status.toLowerCase()}.` };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[admin] invoice status update failed", error);
    return { ok: false, message: "Could not update this invoice." };
  }
}
