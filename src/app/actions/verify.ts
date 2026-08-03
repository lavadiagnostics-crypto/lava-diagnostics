"use server";

import { redirect } from "next/navigation";
import { verifyCertificate } from "@/lib/certificates/verify";
import { verifyQuerySchema } from "@/lib/validations/certificate";

/**
 * Public verification action.
 *
 * Returns a discriminated result rather than throwing, and never includes the
 * certificate itself - on success it redirects to the token URL, which is the
 * only place a certificate is rendered. That keeps exactly one code path
 * responsible for displaying a certificate.
 */
export type VerifyActionResult =
  | { status: "REDIRECT" }
  | { status: "NOT_FOUND" }
  | { status: "CODE_REQUIRED" }
  | { status: "RATE_LIMITED"; retryAfterSeconds: number }
  | { status: "INVALID"; message: string };

export async function submitVerification(
  raw: unknown,
): Promise<VerifyActionResult> {
  const parsed = verifyQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "INVALID",
      message:
        parsed.error.issues[0]?.message ??
        "Enter a certificate number or verification code.",
    };
  }

  const outcome = await verifyCertificate({
    certificateNumber: parsed.data.certificateNumber,
    verificationCode: parsed.data.verificationCode,
  });

  switch (outcome.status) {
    case "SUCCESS":
      // Redirect to the canonical token URL. The grant cookie was already set,
      // so the destination renders without consuming another lookup.
      redirect(`/verify/${outcome.certificate.verificationToken}`);

    case "REVOKED":
      // A revoked certificate still has a page - the holder needs to see why.
      redirect(`/verify/${outcome.certificate.verificationToken}`);

    case "RATE_LIMITED":
      return {
        status: "RATE_LIMITED",
        retryAfterSeconds: outcome.retryAfterSeconds,
      };

    case "CODE_REQUIRED":
      return { status: "CODE_REQUIRED" };

    case "NOT_FOUND":
      return { status: "NOT_FOUND" };
  }
}
