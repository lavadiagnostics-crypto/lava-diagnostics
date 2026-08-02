import { z } from "zod";

/**
 * Certificate schemas.
 *
 * The verify schema is intentionally permissive about *format* — it accepts
 * anything that could plausibly be a reference — and strict about *length*. Any
 * real filtering happens as an exact database match, so a malformed query and a
 * non-existent certificate are indistinguishable to the caller.
 */

export const verifyQuerySchema = z
  .object({
    certificateNumber: z.string().trim().max(64).optional().or(z.literal("")),
    verificationCode: z.string().trim().max(64).optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      Boolean(data.certificateNumber?.trim()) ||
      Boolean(data.verificationCode?.trim()),
    {
      message: "Enter a certificate number or a verification code.",
      path: ["certificateNumber"],
    },
  );

export type VerifyQueryInput = z.infer<typeof verifyQuerySchema>;

const decimalString = z
  .string()
  .trim()
  .regex(/^\d{1,4}(\.\d{1,3})?$/, "Enter a number, e.g. 99.12")
  .optional()
  .or(z.literal(""));

export const certificateMetadataSchema = z.object({
  customerId: z.string().min(1, "Select a customer."),
  orderId: z.string().optional().or(z.literal("")),
  sampleId: z.string().optional().or(z.literal("")),
  product: z.string().trim().min(2, "Enter the product name.").max(160),
  batchNumber: z.string().trim().min(1, "Enter the batch number.").max(80),
  lotNumber: z.string().trim().max(80).optional().or(z.literal("")),
  result: z.enum(["PASS", "FAIL", "INCONCLUSIVE"]),
  purityResult: decimalString,
  contentResult: decimalString,
  testedFor: z.array(z.string().trim().min(1)).max(24).default([]),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
  signedBy: z.string().trim().max(120).optional().or(z.literal("")),
  signedTitle: z.string().trim().max(120).optional().or(z.literal("")),
  issuedDate: z.string().min(1, "Choose an issue date."),
  internalNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  /** Release immediately on upload rather than leaving it PRIVATE. */
  releaseImmediately: z.boolean().default(false),
});

export type CertificateMetadataInput = z.infer<typeof certificateMetadataSchema>;

export const certificateSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  customerId: z.string().optional(),
  status: z
    .enum(["ALL", "PRIVATE", "VERIFIED", "REVOKED", "ARCHIVED"])
    .default("ALL"),
  result: z.enum(["ALL", "PASS", "FAIL", "INCONCLUSIVE"]).default("ALL"),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type CertificateSearchInput = z.infer<typeof certificateSearchSchema>;

export const revokeSchema = z.object({
  certificateId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(10, "Give a reason of at least 10 characters — it is shown on the verification page.")
    .max(500),
});
