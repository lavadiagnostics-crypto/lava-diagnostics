import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Enter a subject.").max(160),
  body: z
    .string()
    .trim()
    .min(20, "Please give us at least a couple of sentences.")
    .max(4000),
  /**
   * Honeypot. Real users never see or fill this; bots usually do. A non-empty
   * value is accepted with a success response and silently discarded.
   */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const orderStatusUpdateSchema = z
  .object({
    orderId: z.string().min(1),
    status: z.enum([
      "PENDING",
      "ACCEPTED",
      "REJECTED",
      "SAMPLE_RECEIVED",
      "TESTING",
      "AWAITING_RESULTS",
      "COMPLETED",
      "SHIPPED",
      "CANCELLED",
    ]),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
    rejectionReason: z.string().trim().max(500).optional().or(z.literal("")),
    trackingCarrier: z.string().trim().max(80).optional().or(z.literal("")),
    trackingNumber: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectionReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "A rejection reason is required — it is emailed to the customer.",
      });
    }
  });

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export const customerUpsertSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().trim().min(2, "Enter a company name.").max(160),
  contactPerson: z.string().trim().min(2, "Enter a contact name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().min(6, "Enter a phone number.").max(40),
  vatNumber: z.string().trim().max(60).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const invoiceStatusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"]),
});

export const messageReplySchema = z.object({
  messageId: z.string().min(1),
  replyBody: z.string().trim().min(10, "Write a reply.").max(4000),
});
