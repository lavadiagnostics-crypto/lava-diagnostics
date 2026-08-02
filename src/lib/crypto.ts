import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Certificate integrity and access-grant primitives.
 *
 * Two distinct jobs live here:
 *
 *  1. `certificateHash` — a tamper-evident fingerprint printed on the
 *     verification page. A holder can compare the hash shown by LAVA against
 *     the hash of the PDF they possess to prove the document was not altered.
 *
 *  2. `signAccessGrant` / `verifyAccessGrant` — a short-lived, single-certificate
 *     capability issued only after a successful verification. The PDF route
 *     accepts nothing else. This is what keeps object storage private: the
 *     browser never receives a storage URL, only a grant scoped to one
 *     certificate for a few minutes.
 */

function hashSecret(): string {
  return serverEnv().CERTIFICATE_HASH_SECRET;
}

/** Constant-time string comparison that tolerates unequal lengths. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still perform a comparison so timing does not reveal the length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export interface CertificateHashInput {
  certificateNumber: string;
  customerName: string;
  product: string;
  batchNumber: string;
  issuedDate: Date;
  /** SHA-256 of the PDF bytes, so any edit to the document changes the hash. */
  pdfSha256: string;
}

/** SHA-256 of arbitrary bytes, hex-encoded. */
export function sha256(data: Buffer | Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Deterministic HMAC over the certificate's immutable fields plus the document
 * digest. Keyed so that a third party cannot forge a matching hash for a
 * fabricated certificate.
 */
export function certificateHash(input: CertificateHashInput): string {
  const canonical = [
    input.certificateNumber,
    input.customerName.trim(),
    input.product.trim(),
    input.batchNumber.trim(),
    input.issuedDate.toISOString().slice(0, 10),
    input.pdfSha256,
  ].join("|");

  return createHmac("sha256", hashSecret()).update(canonical).digest("hex");
}

/**
 * Hashes a client IP for rate limiting and access logs.
 *
 * Keyed and truncated: enough to correlate repeated abuse from one source,
 * but not a reversible record of who visited which certificate.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHmac("sha256", hashSecret())
    .update(`ip:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

// ── Access grants ─────────────────────────────────────────────

const GRANT_VERSION = "v1";

/** Default grant lifetime. Deliberately short — long enough to read a PDF. */
export const GRANT_TTL_SECONDS = 15 * 60;

export interface AccessGrant {
  certificateId: string;
  /** Unix seconds. */
  expiresAt: number;
}

function grantPayload(certificateId: string, expiresAt: number): string {
  return `${GRANT_VERSION}.${certificateId}.${expiresAt}`;
}

/**
 * Issues a capability for exactly one certificate.
 *
 * The grant is stored in an HttpOnly, SameSite=Strict cookie rather than a URL
 * parameter, so it cannot leak through a Referer header, a shared link, or a
 * screenshot of the address bar.
 */
export function signAccessGrant(
  certificateId: string,
  ttlSeconds = GRANT_TTL_SECONDS,
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = grantPayload(certificateId, expiresAt);
  const signature = createHmac("sha256", hashSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Validates a grant and returns it, or null if it is malformed, tampered with,
 * or expired. Never throws, so a hostile cookie value cannot crash the route.
 */
export function verifyAccessGrant(raw: string | undefined): AccessGrant | null {
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 4) return null;

  const [version, certificateId, expiresRaw, signature] = parts;
  if (version !== GRANT_VERSION) return null;

  const expiresAt = Number.parseInt(expiresRaw, 10);
  if (!Number.isFinite(expiresAt)) return null;

  const expected = createHmac("sha256", hashSecret())
    .update(grantPayload(certificateId, expiresAt))
    .digest("base64url");

  if (!safeEqual(signature, expected)) return null;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return null;

  return { certificateId, expiresAt };
}

/** Cookie name holding the active certificate grant. */
export const GRANT_COOKIE = "lava_coa_grant";
