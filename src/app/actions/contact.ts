"use server";

import { hashIp } from "@/lib/crypto";
import { clientIp } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env";
import {
  sendContactAcknowledgement,
  sendInternalNotification,
} from "@/lib/email/templates";
import { contactSchema } from "@/lib/validations/misc";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Handles a public contact-form submission.
 *
 * Rate-limited and honeypot-guarded. Note that the honeypot path returns a
 * success response without persisting anything - telling a bot it was detected
 * only helps it adapt.
 */
export async function submitContactForm(
  raw: unknown,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Honeypot tripped: pretend it worked, store nothing.
  if (data.website && data.website.length > 0) {
    return { ok: true, message: "Thank you - your message has been received." };
  }

  const ipHash = hashIp(await clientIp());
  const limit = await rateLimit({
    key: `contact:${ipHash ?? "anon"}`,
    ...RATE_LIMITS.contact,
  });

  if (!limit.success) {
    return {
      ok: false,
      message:
        "Too many messages sent from this connection. Please try again shortly, or email the laboratory directly.",
    };
  }

  try {
    // Link the enquiry to an existing customer when the address matches, so the
    // admin sees it in context.
    const customer = await prisma.customer.findFirst({
      where: { email: data.email },
      select: { id: true },
    });

    await prisma.message.create({
      data: {
        customerId: customer?.id ?? null,
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
        subject: data.subject,
        body: data.body,
        ipHash,
      },
      select: { id: true },
    });

    // Notifications are best-effort; the enquiry is already safely stored.
    await Promise.allSettled([
      sendContactAcknowledgement({
        to: data.email,
        name: data.name,
        subject: data.subject,
      }),
      sendInternalNotification({
        to: serverEnv().EMAIL_INTERNAL_INBOX,
        heading: "New enquiry received",
        paragraphs: [data.body],
        facts: [
          { label: "From", value: `${data.name} <${data.email}>` },
          ...(data.company ? [{ label: "Company", value: data.company }] : []),
          ...(data.phone ? [{ label: "Phone", value: data.phone }] : []),
          { label: "Subject", value: data.subject },
        ],
        href: "/admin/messages",
        replyTo: data.email,
      }),
    ]);

    return {
      ok: true,
      message:
        "Thank you - your message has reached the laboratory. We typically reply within one business day.",
    };
  } catch (error) {
    console.error("[contact] failed to store enquiry", error);
    return {
      ok: false,
      message:
        "We could not record your message. Please email the laboratory directly.",
    };
  }
}
