import { serverEnv } from "@/lib/env";
import { localDriver } from "@/lib/storage/local";
import { supabaseDriver } from "@/lib/storage/supabase";
import { sanitiseFilename } from "@/lib/storage/limits";

/**
 * Private object storage.
 *
 * Every object written through this module lives in a bucket that is NOT
 * publicly readable. There is deliberately no `getPublicUrl` on this interface —
 * the only way bytes reach a browser is `download()` from a server route that
 * has already authorised the request.
 *
 * `signedUrl()` exists for the narrow case of handing a short-lived URL to an
 * embedded viewer; it is not used for certificate PDFs, which are streamed
 * through our own route so that access is logged and revocable.
 */
export interface StorageDriver {
  readonly name: string;
  upload(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<{ key: string; sizeBytes: number }>;
  download(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  remove(keys: string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Short-lived URL. Throws on drivers that cannot mint one. */
  signedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (driver) return driver;
  driver =
    serverEnv().STORAGE_DRIVER === "supabase" ? supabaseDriver() : localDriver();
  return driver;
}

/**
 * Upload constraints live in `./limits`, which is free of Node built-ins so
 * client-side upload forms can import them. Re-exported here for server code.
 */
export {
  MAX_PDF_BYTES,
  MAX_IMAGE_BYTES,
  sanitiseFilename,
} from "@/lib/storage/limits";

/** Namespaced object keys. Random segment prevents key guessing. */
export const storageKeys = {
  certificatePdf: (certificateId: string, revision: number) =>
    `certificates/${certificateId}/r${revision}/coa.pdf`,
  certificateThumbnail: (certificateId: string, revision: number) =>
    `certificates/${certificateId}/r${revision}/thumbnail.png`,
  chromatogram: (certificateId: string, filename: string) =>
    `certificates/${certificateId}/chromatograms/${sanitiseFilename(filename)}`,
  spectrum: (certificateId: string, filename: string) =>
    `certificates/${certificateId}/spectra/${sanitiseFilename(filename)}`,
  invoicePdf: (invoiceId: string) => `invoices/${invoiceId}/invoice.pdf`,
};

/** PDF magic number check — guards against a renamed non-PDF upload. */
export function looksLikePdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}
