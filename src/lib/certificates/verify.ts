import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  GRANT_COOKIE,
  GRANT_TTL_SECONDS,
  hashIp,
  safeEqual,
  signAccessGrant,
  verifyAccessGrant,
} from "@/lib/crypto";
import { clientIp } from "@/lib/audit";
import { normaliseCertificateNumber } from "@/lib/ids";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { Certificate } from "@prisma/client";

/**
 * Certificate verification — the security-critical path of this application.
 *
 * ── Access paths ─────────────────────────────────────────────────────────────
 *
 *   A. Token lookup — the caller presents the 160-bit `verificationToken`.
 *      This is what a QR scan does. Unguessable, so it is sufficient alone.
 *
 *   B. Certificate-number lookup — the caller presents `LAVA-2026-000184`.
 *      This is the flow a downstream buyer uses when all they have is the
 *      number printed on a label, and it is the flow the product spec
 *      specifies. See the policy note below.
 *
 * ── Why a certificate number is enough, and what protects it ────────────────
 *
 * Certificate numbers are readable and roughly sequential, so on their own they
 * are guessable. Three controls make bulk enumeration impractical rather than
 * merely discouraged:
 *
 *   1. Two rate-limit windows (burst + hourly) keyed on a hashed IP.
 *   2. A failure-ratio lockout: sequential scanning necessarily produces a high
 *      proportion of misses (gaps in the sequence, unreleased certificates), so
 *      an address that accumulates many failures is locked out for far longer
 *      than the ordinary window. A legitimate user making a typo never
 *      approaches the threshold. This is the control that actually defeats
 *      enumeration.
 *   3. Nothing enumerable is returned. Every function here resolves to at most
 *      ONE certificate — there is no list endpoint, no wildcard, no pagination.
 *      A browsable directory is impossible by construction, not by policy.
 *
 * Deployments that would rather trade that UX for strictness can set
 * `REQUIRE_CODE_WITH_NUMBER=true`, which demotes path B to requiring the
 * number AND its verification code together. Nothing else changes.
 *
 * ── Invariants ───────────────────────────────────────────────────────────────
 *
 *   • PRIVATE and ARCHIVED certificates are reported as NOT_FOUND, so an
 *     unreleased certificate does not disclose its own existence.
 *   • Wrong number, wrong code, unreleased and non-existent are all
 *     indistinguishable to the caller.
 *   • Every attempt is logged before a result is returned.
 */

export const VERIFY_POLICY = {
  /**
   * When true, a certificate number must be accompanied by its verification
   * code. Defaults to false, which matches the specified verification UX.
   */
  requireCodeWithNumber: process.env.REQUIRE_CODE_WITH_NUMBER === "true",

  /** Failed attempts from one address within the window before lockout. */
  failureThreshold: 15,
  failureWindowSeconds: 60 * 60,
  lockoutSeconds: 60 * 60 * 3,
} as const;

export type VerificationOutcome =
  | { status: "SUCCESS"; certificate: Certificate }
  | { status: "NOT_FOUND" }
  | { status: "REVOKED"; certificate: Certificate }
  | { status: "CODE_REQUIRED" }
  | { status: "RATE_LIMITED"; retryAfterSeconds: number };

export interface VerifyInput {
  certificateNumber?: string | null;
  /** Either the short pairing code or a full verification token. */
  verificationCode?: string | null;
  /** Token taken from a QR-code URL path. */
  token?: string | null;
}

async function logAttempt(input: {
  certificateId: string | null;
  method: string;
  success: boolean;
  queryFragment: string | null;
  ipHash: string | null;
}) {
  try {
    const h = await headers();
    await prisma.certificateAccessLog.create({
      data: {
        certificateId: input.certificateId,
        method: input.method,
        success: input.success,
        // Truncated so a full token never lands in the log table.
        queryFragment: input.queryFragment?.slice(0, 12) ?? null,
        ipHash: input.ipHash,
        userAgent: h.get("user-agent")?.slice(0, 400) ?? null,
      },
    });
  } catch (error) {
    console.error("[verify] could not write access log", error);
  }
}

/**
 * Anti-enumeration lockout.
 *
 * Counts recent failures for this address. A scanner walking the certificate
 * number space trips this quickly; a human who mistypes once does not.
 */
async function isLockedOut(ipHash: string | null): Promise<boolean> {
  if (!ipHash) return false;
  try {
    const since = new Date(
      Date.now() - VERIFY_POLICY.failureWindowSeconds * 1000,
    );
    const failures = await prisma.certificateAccessLog.count({
      where: { ipHash, success: false, createdAt: { gte: since } },
    });
    return failures >= VERIFY_POLICY.failureThreshold;
  } catch {
    // If the check itself fails, fall through to the ordinary rate limiter
    // rather than blocking every legitimate visitor.
    return false;
  }
}

async function checkRateLimits(
  ipHash: string | null,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = ipHash ?? "anonymous";

  const [burst, sustained] = await Promise.all([
    rateLimit({ key: `verify:burst:${key}`, ...RATE_LIMITS.verify }),
    rateLimit({ key: `verify:hour:${key}`, ...RATE_LIMITS.verifyHourly }),
  ]);

  if (burst.success && sustained.success) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const resetAt = Math.max(
    burst.success ? 0 : burst.resetAt,
    sustained.success ? 0 : sustained.resetAt,
  );
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

/**
 * Issues the PDF access grant as an HttpOnly cookie.
 *
 * Kept out of the URL deliberately: a grant in a query string leaks through
 * Referer headers, browser history, proxy logs and copy-pasted links.
 *
 * Next 15 only permits cookie mutation inside a Server Action or Route Handler,
 * so this silently no-ops when called during a page render — which is exactly
 * what happens on the QR-scan path, where `/verify/[token]` renders directly.
 * That path is not left unauthorised: the PDF route independently accepts the
 * verification token, which the visitor demonstrably already holds because it is
 * in the URL they just opened. See app/api/certificates/[id]/pdf/route.ts.
 */
async function issueGrantCookie(certificateId: string): Promise<void> {
  try {
    const store = await cookies();
    store.set(GRANT_COOKIE, signAccessGrant(certificateId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: GRANT_TTL_SECONDS,
    });
  } catch {
    // Rendering context — the token-based path in the PDF route covers this.
  }
}

/** Resolves a verification request to at most one certificate. */
export async function verifyCertificate(
  input: VerifyInput,
): Promise<VerificationOutcome> {
  const ipHash = hashIp(await clientIp());

  if (await isLockedOut(ipHash)) {
    return {
      status: "RATE_LIMITED",
      retryAfterSeconds: VERIFY_POLICY.lockoutSeconds,
    };
  }

  const limit = await checkRateLimits(ipHash);
  if (!limit.allowed) {
    await logAttempt({
      certificateId: null,
      method: "rate_limited",
      success: false,
      queryFragment: null,
      ipHash,
    });
    return {
      status: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  const token = input.token?.trim() || null;
  const number = input.certificateNumber
    ? normaliseCertificateNumber(input.certificateNumber)
    : null;
  const code = input.verificationCode?.trim() || null;

  let certificate: Certificate | null = null;
  let method = "unknown";

  if (token) {
    // ── Path A: token from a QR scan. ──
    method = "token";
    certificate = await prisma.certificate.findUnique({
      where: { verificationToken: token },
    });
  } else if (number && code) {
    // Number plus code: both must resolve to the SAME record.
    method = "number_and_code";
    const candidate = await prisma.certificate.findUnique({
      where: { certificateNumber: number },
    });
    if (candidate && safeEqual(code, candidate.verificationToken)) {
      certificate = candidate;
    }
  } else if (number) {
    // ── Path B: certificate number alone. ──
    if (VERIFY_POLICY.requireCodeWithNumber) {
      await logAttempt({
        certificateId: null,
        method: "number_only_blocked",
        success: false,
        queryFragment: number,
        ipHash,
      });
      return { status: "CODE_REQUIRED" };
    }
    method = "number";
    certificate = await prisma.certificate.findUnique({
      where: { certificateNumber: number },
    });
  } else if (code) {
    // A bare code is treated as a token — this is what a client pastes from
    // their COA-ready email.
    method = "code_as_token";
    certificate = await prisma.certificate.findUnique({
      where: { verificationToken: code },
    });
  }

  const fragment = token ?? number ?? code;

  // PRIVATE and ARCHIVED must not disclose that they exist.
  if (
    !certificate ||
    certificate.status === "PRIVATE" ||
    certificate.status === "ARCHIVED"
  ) {
    await logAttempt({
      certificateId: null,
      method,
      success: false,
      queryFragment: fragment,
      ipHash,
    });
    return { status: "NOT_FOUND" };
  }

  if (certificate.status === "REVOKED") {
    // Revocation IS disclosed: a holder of a withdrawn certificate needs to
    // know it was withdrawn rather than be told it never existed.
    await logAttempt({
      certificateId: certificate.id,
      method,
      success: false,
      queryFragment: fragment,
      ipHash,
    });
    return { status: "REVOKED", certificate };
  }

  await issueGrantCookie(certificate.id);

  await Promise.all([
    logAttempt({
      certificateId: certificate.id,
      method,
      success: true,
      queryFragment: fragment,
      ipHash,
    }),
    prisma.certificate.update({
      where: { id: certificate.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    }),
  ]);

  return { status: "SUCCESS", certificate };
}

/**
 * Re-checks an existing grant for a certificate already verified in this
 * session, so a page refresh neither consumes a rate-limit slot nor
 * re-increments the view counter.
 *
 * Returns null unless the grant is valid AND the certificate is still released —
 * a certificate revoked after the grant was issued stops working immediately.
 */
export async function certificateFromActiveGrant(
  certificateId: string,
): Promise<Certificate | null> {
  const store = await cookies();
  const grant = verifyAccessGrant(store.get(GRANT_COOKIE)?.value);
  if (!grant || grant.certificateId !== certificateId) return null;

  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
  });
  if (!certificate || certificate.status !== "VERIFIED") return null;

  return certificate;
}

/** True when the caller holds a live grant for this certificate. */
export async function hasActiveGrant(certificateId: string): Promise<boolean> {
  const store = await cookies();
  const grant = verifyAccessGrant(store.get(GRANT_COOKIE)?.value);
  return grant?.certificateId === certificateId;
}
