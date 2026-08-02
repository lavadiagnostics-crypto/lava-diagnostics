import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Human-readable reference generation.
 *
 * Certificate numbers are intentionally readable and roughly sequential —
 * clients quote them on purchase orders and printed paperwork. That makes them
 * guessable, which is fine ONLY because a certificate number alone never opens
 * a certificate: the verification flow additionally requires the 160-bit
 * `verificationToken`. See lib/certificates/verify.ts.
 */

/** Crockford base32: no I, L, O or U, so codes survive being read aloud. */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** URL-safe, unambiguous alphabet for verification tokens. */
const TOKEN_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * 160 bits of cryptographically secure randomness, rendered in a URL-safe
 * alphabet. This is the bearer secret embedded in the QR code. At this size,
 * brute-forcing is infeasible even without rate limiting — but the endpoint is
 * rate-limited anyway.
 */
export function generateVerificationToken(length = 28): string {
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length; i++) {
    // Rejection sampling keeps the distribution uniform across the alphabet.
    const byte = bytes[i % bytes.length];
    if (byte < 256 - (256 % TOKEN_ALPHABET.length)) {
      out += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
    }
  }
  return out;
}

/**
 * Short code a client can type from a printed certificate, e.g. "K7M2-9QXF".
 * Used as an alternative to scanning. Random, not derived from the number.
 */
export function generateShortVerificationCode(): string {
  const pick = () =>
    Array.from({ length: 4 }, () => CROCKFORD[randomInt(CROCKFORD.length)]).join(
      "",
    );
  return `${pick()}-${pick()}`;
}

async function nextSequence(
  model: "certificate" | "order" | "sample" | "invoice",
  year: number,
): Promise<number> {
  // Count existing rows for the year and add a jitter-free increment. Wrapped in
  // a retry by the callers, which handle the unique-constraint race.
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const where = { createdAt: { gte: start, lt: end } };
  const count =
    model === "certificate"
      ? await prisma.certificate.count({ where })
      : model === "order"
        ? await prisma.order.count({ where })
        : model === "sample"
          ? await prisma.sample.count({ where })
          : await prisma.invoice.count({ where });

  return count + 1;
}

function pad(n: number, width = 6): string {
  return String(n).padStart(width, "0");
}

/**
 * Allocates the next reference for a model, retrying on collision.
 *
 * Counting rows is not atomic, so two concurrent submissions can derive the
 * same sequence. The unique constraint in Postgres is the real guard; this loop
 * simply walks forward until an unused reference is found.
 */
async function allocate(
  model: "certificate" | "order" | "sample" | "invoice",
  format: (year: number, seq: number) => string,
  exists: (value: string) => Promise<boolean>,
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const seq = await nextSequence(model, year);

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = format(year, seq + attempt);
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Could not allocate a unique reference for ${model}.`);
}

export function generateOrderNumber(year: number, seq: number): string {
  return `LAVA-ORD-${year}-${pad(seq)}`;
}

export async function allocateOrderNumber(): Promise<string> {
  return allocate(
    "order",
    generateOrderNumber,
    async (orderNumber) =>
      (await prisma.order.count({ where: { orderNumber } })) > 0,
  );
}

export async function allocateCertificateNumber(): Promise<string> {
  return allocate(
    "certificate",
    (year, seq) => `LAVA-${year}-${pad(seq)}`,
    async (certificateNumber) =>
      (await prisma.certificate.count({ where: { certificateNumber } })) > 0,
  );
}

export async function allocateSampleCode(): Promise<string> {
  return allocate(
    "sample",
    (year, seq) => `LAVA-S-${year}-${pad(seq)}`,
    async (sampleCode) =>
      (await prisma.sample.count({ where: { sampleCode } })) > 0,
  );
}

export async function allocateInvoiceNumber(): Promise<string> {
  return allocate(
    "invoice",
    (year, seq) => `LAVA-INV-${year}-${pad(seq)}`,
    async (invoiceNumber) =>
      (await prisma.invoice.count({ where: { invoiceNumber } })) > 0,
  );
}

/** Normalises user input before an exact-match lookup. */
export function normaliseCertificateNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
