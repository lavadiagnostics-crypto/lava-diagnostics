import { appUrl } from "@/lib/env";
import { renderEmail } from "@/lib/email/layout";
import { sendEmail, type SendEmailResult } from "@/lib/email/send";
import { formatCents, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@prisma/client";

/**
 * The complete set of lifecycle emails.
 *
 * Note what these deliberately do NOT contain: certificate verification tokens
 * are only ever sent to the customer who owns the certificate, and only as a
 * link they must already be entitled to. No email includes a PDF attachment or
 * a storage URL - recipients are always routed through verification so that
 * access is logged and revocable.
 */

interface OrderEmailContext {
  to: string;
  contactPerson: string;
  companyName: string;
  orderNumber: string;
  totalCents?: number;
  currency?: string;
  sampleCount?: number;
}

export async function sendOrderConfirmation(
  ctx: OrderEmailContext & { estimatedTurnaround: string; requiredVials: number },
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Order ${ctx.orderNumber} received - shipping instructions inside.`,
    heading: "Submission received",
    paragraphs: [
      `Thank you, ${ctx.contactPerson}. We have logged your submission for ${ctx.companyName} and reserved capacity on the analytical schedule.`,
      `Please ship your samples in crimped, unopened vials. Include a printed copy of this order number inside the package so the receiving team can match it to your file on arrival.`,
      `Your samples will not enter the queue until they are physically received and inspected. You will receive a confirmation the moment that happens.`,
    ],
    facts: [
      { label: "Order number", value: ctx.orderNumber },
      { label: "Sample lines", value: String(ctx.sampleCount ?? 0) },
      { label: "Vials to ship", value: String(ctx.requiredVials) },
      { label: "Estimated turnaround", value: ctx.estimatedTurnaround },
      {
        label: "Estimated total",
        value: formatCents(ctx.totalCents ?? 0, ctx.currency),
      },
    ],
    button: { label: "Track this order", href: `${appUrl()}/dashboard/orders` },
    footnote:
      "The estimated total is confirmed at invoicing. Volume tiers are calculated from your monthly submitted volume, so your final invoice may be lower than the estimate above.",
  });

  return sendEmail({
    to: ctx.to,
    subject: `Order ${ctx.orderNumber} received - LAVA Diagnostics`,
    html,
    text,
  });
}

export async function sendSampleReceived(
  ctx: OrderEmailContext,
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Samples for ${ctx.orderNumber} have arrived at the laboratory.`,
    heading: "Samples received at the laboratory",
    paragraphs: [
      `Your samples for order ${ctx.orderNumber} have arrived and passed receiving inspection. Each vial was photographed as received and checked for seal integrity.`,
      "The order is now queued for analysis. We will notify you when testing begins.",
    ],
    facts: [{ label: "Order number", value: ctx.orderNumber }],
    button: { label: "View order", href: `${appUrl()}/dashboard/orders` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `Samples received - ${ctx.orderNumber}`,
    html,
    text,
  });
}

export async function sendTestingStarted(
  ctx: OrderEmailContext,
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Analysis has started on ${ctx.orderNumber}.`,
    heading: "Analysis in progress",
    paragraphs: [
      `Testing has commenced on order ${ctx.orderNumber}. Your samples are now on instrument.`,
      "Results are reviewed and approved by a second analyst before any certificate is issued. You will be notified once your Certificate of Analysis is available.",
    ],
    facts: [{ label: "Order number", value: ctx.orderNumber }],
    button: { label: "Track progress", href: `${appUrl()}/dashboard/orders` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `Testing started - ${ctx.orderNumber}`,
    html,
    text,
  });
}

export async function sendAwaitingResults(
  ctx: OrderEmailContext,
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `${ctx.orderNumber} is in final review.`,
    heading: "Awaiting final review",
    paragraphs: [
      `Instrumental analysis for order ${ctx.orderNumber} is complete. Your data is now with our reviewing analyst for verification and sign-off.`,
      "This is the final step before your Certificate of Analysis is released.",
    ],
    facts: [{ label: "Order number", value: ctx.orderNumber }],
    button: { label: "View order", href: `${appUrl()}/dashboard/orders` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `In final review - ${ctx.orderNumber}`,
    html,
    text,
  });
}

export async function sendOrderAccepted(
  ctx: OrderEmailContext,
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Order ${ctx.orderNumber} has been accepted.`,
    heading: "Order accepted",
    paragraphs: [
      `Order ${ctx.orderNumber} has been reviewed and accepted by the laboratory.`,
      "If you have not already shipped your samples, please do so now, quoting the order number on the package.",
    ],
    facts: [{ label: "Order number", value: ctx.orderNumber }],
    button: { label: "View order", href: `${appUrl()}/dashboard/orders` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `Order accepted - ${ctx.orderNumber}`,
    html,
    text,
  });
}

export async function sendOrderRejected(
  ctx: OrderEmailContext & { reason: string },
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `We were unable to accept order ${ctx.orderNumber}.`,
    heading: "We could not accept this submission",
    paragraphs: [
      `Unfortunately we are unable to proceed with order ${ctx.orderNumber}.`,
      `Reason given by the laboratory: ${ctx.reason}`,
      "No charge has been raised. If you believe this was an error, or you would like to resubmit with amended details, reply to this email and our lab team will help.",
    ],
    facts: [{ label: "Order number", value: ctx.orderNumber }],
    button: { label: "Contact the lab", href: `${appUrl()}/contact` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `Regarding order ${ctx.orderNumber}`,
    html,
    text,
  });
}

export async function sendCoaReady(ctx: {
  to: string;
  contactPerson: string;
  orderNumber: string | null;
  certificateNumber: string;
  verificationToken: string;
  product: string;
  batchNumber: string;
  result: string;
}): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Certificate ${ctx.certificateNumber} is ready to view.`,
    heading: "Your Certificate of Analysis is ready",
    paragraphs: [
      `${ctx.contactPerson}, the Certificate of Analysis for ${ctx.product} (batch ${ctx.batchNumber}) has been reviewed, signed and released.`,
      "Use the secure link below to open it. The certificate is not published anywhere and is only reachable through this link or by entering its certificate number together with its verification code.",
    ],
    facts: [
      { label: "Certificate number", value: ctx.certificateNumber },
      { label: "Product", value: ctx.product },
      { label: "Batch", value: ctx.batchNumber },
      { label: "Result", value: ctx.result },
      ...(ctx.orderNumber
        ? [{ label: "Order", value: ctx.orderNumber }]
        : []),
    ],
    button: {
      label: "Open certificate",
      href: `${appUrl()}/verify/${ctx.verificationToken}`,
    },
    footnote:
      "Treat this link as confidential - anyone holding it can view this certificate. Your customers can independently confirm authenticity by scanning the QR code printed on the document.",
  });

  return sendEmail({
    to: ctx.to,
    subject: `Certificate ${ctx.certificateNumber} released - ${ctx.product}`,
    html,
    text,
  });
}

export async function sendInvoiceIssued(ctx: {
  to: string;
  contactPerson: string;
  invoiceNumber: string;
  orderNumber: string | null;
  totalCents: number;
  currency: string;
  dueDate: Date;
}): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Invoice ${ctx.invoiceNumber} - ${formatCents(ctx.totalCents, ctx.currency)}`,
    heading: "Invoice issued",
    paragraphs: [
      `${ctx.contactPerson}, invoice ${ctx.invoiceNumber} has been issued to your account.`,
      "A full breakdown of the analyses billed is available in your portal.",
    ],
    facts: [
      { label: "Invoice number", value: ctx.invoiceNumber },
      ...(ctx.orderNumber ? [{ label: "Order", value: ctx.orderNumber }] : []),
      {
        label: "Amount due",
        value: formatCents(ctx.totalCents, ctx.currency),
      },
      { label: "Payment due by", value: formatDate(ctx.dueDate) },
    ],
    button: { label: "View invoice", href: `${appUrl()}/dashboard/invoices` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `Invoice ${ctx.invoiceNumber} - LAVA Diagnostics`,
    html,
    text,
  });
}

export async function sendShippingConfirmation(
  ctx: OrderEmailContext & {
    carrier: string | null;
    trackingNumber: string | null;
  },
): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: `Return shipment for ${ctx.orderNumber} is on its way.`,
    heading: "Return shipment dispatched",
    paragraphs: [
      `Retained material and any hard-copy documentation for order ${ctx.orderNumber} has been dispatched to your registered shipping address.`,
      ...(ctx.trackingNumber
        ? []
        : [
            "No tracking reference was recorded for this shipment. Contact the lab if you need one.",
          ]),
    ],
    facts: [
      { label: "Order number", value: ctx.orderNumber },
      ...(ctx.carrier ? [{ label: "Carrier", value: ctx.carrier }] : []),
      ...(ctx.trackingNumber
        ? [{ label: "Tracking number", value: ctx.trackingNumber }]
        : []),
    ],
    button: { label: "View order", href: `${appUrl()}/dashboard/orders` },
  });

  return sendEmail({
    to: ctx.to,
    subject: `Shipment dispatched - ${ctx.orderNumber}`,
    html,
    text,
  });
}

export async function sendContactAcknowledgement(ctx: {
  to: string;
  name: string;
  subject: string;
}): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: "We have received your enquiry.",
    heading: "Thanks - we have your enquiry",
    paragraphs: [
      `${ctx.name}, thank you for contacting LAVA Diagnostics. Your message regarding "${ctx.subject}" has reached our laboratory team.`,
      "Technical enquiries are answered by an analyst, typically within one business day.",
    ],
    button: { label: "Browse the knowledge base", href: `${appUrl()}/knowledge-base` },
  });

  return sendEmail({
    to: ctx.to,
    subject: "We have received your enquiry - LAVA Diagnostics",
    html,
    text,
  });
}

export async function sendInternalNotification(ctx: {
  to: string;
  heading: string;
  paragraphs: string[];
  facts?: { label: string; value: string }[];
  href?: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const { html, text } = renderEmail({
    preheader: ctx.heading,
    heading: ctx.heading,
    paragraphs: ctx.paragraphs,
    facts: ctx.facts,
    button: ctx.href
      ? { label: "Open in admin", href: `${appUrl()}${ctx.href}` }
      : undefined,
  });

  return sendEmail({
    to: ctx.to,
    subject: `[LAVA] ${ctx.heading}`,
    html,
    text,
    replyTo: ctx.replyTo,
  });
}

/**
 * Maps an order status transition to its customer notification.
 * Returns null for statuses that intentionally do not email the customer.
 */
export async function sendStatusEmail(
  status: OrderStatus,
  ctx: OrderEmailContext & {
    reason?: string | null;
    carrier?: string | null;
    trackingNumber?: string | null;
  },
): Promise<SendEmailResult | null> {
  switch (status) {
    case "ACCEPTED":
      return sendOrderAccepted(ctx);
    case "REJECTED":
      return sendOrderRejected({
        ...ctx,
        reason: ctx.reason ?? "Not specified.",
      });
    case "SAMPLE_RECEIVED":
      return sendSampleReceived(ctx);
    case "TESTING":
      return sendTestingStarted(ctx);
    case "AWAITING_RESULTS":
      return sendAwaitingResults(ctx);
    case "SHIPPED":
      return sendShippingConfirmation({
        ...ctx,
        carrier: ctx.carrier ?? null,
        trackingNumber: ctx.trackingNumber ?? null,
      });
    case "COMPLETED":
      // The COA-ready email is the meaningful notification here and is sent
      // when the certificate is released, not when the order flips status.
      return null;
    case "PENDING":
    case "CANCELLED":
      return null;
  }
}
