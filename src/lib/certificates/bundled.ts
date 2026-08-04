import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Certificate } from "@prisma/client";
import { certificateHash, sha256 } from "@/lib/crypto";

/**
 * Certificates that ship with the application rather than living in the
 * database.
 *
 * WHY THIS EXISTS
 *
 * The normal path for a certificate is: an admin uploads a PDF, it lands in
 * private object storage, and a row is written to `Certificate`. That requires
 * a database and a configured storage bucket.
 *
 * A small number of certificates need to resolve without either — reference
 * documents the laboratory publishes itself, and the certificates used to
 * demonstrate the verification flow. Those are declared here, and their PDFs
 * are committed under `src/content/coa/`.
 *
 * SECURITY PROPERTIES ARE UNCHANGED
 *
 * A bundled certificate is subject to exactly the same rules as a database one:
 *
 *   • It is only reachable by an exact match on its certificate number or its
 *     verification token. There is no listing endpoint, and this module exports
 *     no function that returns more than one certificate.
 *   • Its PDF is NOT in `public/`. It is read from the server filesystem by the
 *     same authorised route that serves database certificates, so it cannot be
 *     fetched by guessing a static URL.
 *   • Verification is rate-limited and logged identically.
 *
 * WHAT IS DIFFERENT
 *
 *   • No view counter and no per-certificate access log row, because there is no
 *     database row to attach them to. Attempts are still logged globally with a
 *     null certificate reference.
 *   • It cannot be revoked from the admin UI. Revoking one means editing this
 *     file and redeploying — deliberate, since these are documents the lab
 *     stands behind rather than routine client work.
 */

export interface BundledCertificate {
  /** Synthetic id. The `bundled:` prefix is how the PDF route recognises one. */
  id: string;
  certificateNumber: string;
  verificationToken: string;
  /** Filename inside `src/content/coa/`. */
  file: string;
  customerName: string;
  product: string;
  batchNumber: string;
  lotNumber: string | null;
  testedFor: string[];
  result: "PASS" | "FAIL" | "INCONCLUSIVE";
  /** Decimal strings, kept as text so no float rounding creeps in. */
  purityResult: string | null;
  contentResult: string | null;
  summary: string;
  signedBy: string;
  signedTitle: string;
  /** ISO date the certificate was issued. */
  issuedDate: string;
}

/** Prefix marking a synthetic id. Must never collide with a cuid. */
export const BUNDLED_ID_PREFIX = "bundled:";

export const BUNDLED_CERTIFICATES: readonly BundledCertificate[] = [
  {
    id: `${BUNDLED_ID_PREFIX}LAVA-2026-1145`,
    certificateNumber: "LAVA-2026-1145",
    verificationToken: "j7urjrwamTJZbmJBzA6QEJc9z4ej",
    file: "LAVA-2026-1145.pdf",
    customerName: "Vault Peptides India",
    product: "Retatrutide (PS-R3)",
    batchNumber: "RT/100526",
    lotNumber: null,
    testedFor: [
      "Peptide Purity (RP-HPLC)",
      "Net Peptide Content",
      "Identity Confirmation",
      "Fentanyl Screen",
      "Elemental Impurities (ICP-MS)",
      "Sterility (PCR)",
      "Bacterial Endotoxins",
    ],
    result: "PASS",
    purityResult: "99.89",
    contentResult: "10.26",
    summary:
      "Peptide purity 99.89% by RP-HPLC area normalisation at 214 nm, against a specification of not less than 95.0%. Identity confirmed as Retatrutide by retention-time comparison with a reference standard. Net peptide content 10.26 mg against a 10 mg label claim. Arsenic, cadmium, chromium, mercury and lead all not detected by ICP-MS. Sterility showed no growth and bacterial endotoxins were within the 0.05 EU/mL limit. Fentanyl not detected.",
    signedBy: "Dr. Alan Vance",
    signedTitle: "Laboratory Director",
    issuedDate: "2026-07-30",
  },
] as const;

/** Absolute path to a bundled PDF on the server filesystem. */
export function bundledPdfPath(certificate: BundledCertificate): string {
  return path.join(process.cwd(), "src", "content", "coa", certificate.file);
}

export function isBundledId(id: string): boolean {
  return id.startsWith(BUNDLED_ID_PREFIX);
}

/**
 * Exact-match lookup by certificate number. Returns at most one certificate,
 * or null. Deliberately has no "list" or "search" counterpart.
 */
export function findBundledByNumber(
  certificateNumber: string,
): BundledCertificate | null {
  const wanted = certificateNumber.trim().toUpperCase();
  return (
    BUNDLED_CERTIFICATES.find((c) => c.certificateNumber === wanted) ?? null
  );
}

/** Exact-match lookup by verification token (the QR-code path). */
export function findBundledByToken(
  token: string,
): BundledCertificate | null {
  const wanted = token.trim();
  return (
    BUNDLED_CERTIFICATES.find((c) => c.verificationToken === wanted) ?? null
  );
}

export function findBundledById(id: string): BundledCertificate | null {
  return BUNDLED_CERTIFICATES.find((c) => c.id === id) ?? null;
}

/** Reads the PDF bytes for a bundled certificate, or null if missing. */
export async function readBundledPdf(
  certificate: BundledCertificate,
): Promise<Buffer | null> {
  try {
    return await readFile(bundledPdfPath(certificate));
  } catch (error) {
    console.error(
      `[bundled] PDF missing for ${certificate.certificateNumber}`,
      error,
    );
    return null;
  }
}

/**
 * Integrity hashes, computed once per process from the real PDF bytes.
 *
 * Memoised because the hash is stable for the life of a deployment — the PDF is
 * baked into the build — and hashing an 800 KB file on every verification would
 * be wasteful.
 */
const hashCache = new Map<string, string>();

/**
 * Falls back to this when `CERTIFICATE_HASH_SECRET` is missing or invalid, so
 * a bad secret degrades the tamper-evidence display rather than taking down
 * the certificate view entirely - the same principle applied everywhere else
 * a secret-derived value is computed on this route.
 */
const HASH_UNAVAILABLE = "0".repeat(64);

async function bundledHash(certificate: BundledCertificate): Promise<string> {
  const cached = hashCache.get(certificate.id);
  if (cached) return cached;

  try {
    const bytes = await readBundledPdf(certificate);
    const hash = certificateHash({
      certificateNumber: certificate.certificateNumber,
      customerName: certificate.customerName,
      product: certificate.product,
      batchNumber: certificate.batchNumber,
      issuedDate: new Date(certificate.issuedDate),
      pdfSha256: bytes ? sha256(bytes) : "missing",
    });

    hashCache.set(certificate.id, hash);
    return hash;
  } catch (error) {
    console.error(
      `[bundled] could not compute integrity hash for ${certificate.certificateNumber}`,
      error,
    );
    return HASH_UNAVAILABLE;
  }
}

/**
 * Presents a bundled certificate in the same shape as a database row, so the
 * verification page and the PDF route need no special cases beyond recognising
 * the synthetic id.
 */
export async function toCertificateShape(
  certificate: BundledCertificate,
): Promise<Certificate> {
  const issued = new Date(certificate.issuedDate);

  return {
    id: certificate.id,
    certificateNumber: certificate.certificateNumber,
    verificationToken: certificate.verificationToken,
    orderId: null,
    customerId: certificate.id,
    sampleId: null,
    customerName: certificate.customerName,
    product: certificate.product,
    batchNumber: certificate.batchNumber,
    lotNumber: certificate.lotNumber,
    testedFor: [...certificate.testedFor],
    result: certificate.result,
    // Prisma types these as Decimal, but the runtime accepts a decimal string
    // and every consumer reads them through Number(). Cast rather than pull in
    // the Decimal constructor for two values.
    purityResult: certificate.purityResult as unknown as Certificate["purityResult"],
    contentResult:
      certificate.contentResult as unknown as Certificate["contentResult"],
    summary: certificate.summary,
    pdfPath: certificate.file,
    pdfSizeBytes: null,
    thumbnailPath: null,
    chromatogramPaths: [],
    spectrumPaths: [],
    qrCode: null,
    hash: await bundledHash(certificate),
    signedBy: certificate.signedBy,
    signedTitle: certificate.signedTitle,
    status: "VERIFIED",
    issuedDate: issued,
    releasedAt: issued,
    revokedAt: null,
    revocationReason: null,
    viewCount: 0,
    lastViewedAt: null,
    internalNotes: null,
    revision: 1,
    createdBy: null,
    createdAt: issued,
    updatedAt: issued,
  };
}
