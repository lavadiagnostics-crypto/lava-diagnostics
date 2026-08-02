import { mkdir, readFile, unlink, writeFile, stat } from "node:fs/promises";
import { dirname, join, normalize, resolve, sep } from "node:path";
import type { StorageDriver } from "@/lib/storage";

/**
 * Development storage driver.
 *
 * Writes to `./.storage`, which is gitignored and — critically — is NOT inside
 * `public/`, so Next will never serve these files statically. Bytes are only
 * reachable through the authorised download route, exactly as in production.
 *
 * Not suitable for production: serverless filesystems are ephemeral and not
 * shared between instances. Use the Supabase driver there.
 */

const ROOT = resolve(process.cwd(), ".storage");

/** Rejects any key that would escape the storage root. */
function resolveKey(key: string): string {
  const target = resolve(ROOT, normalize(key));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    throw new Error("Rejected storage key: path traversal attempt.");
  }
  return target;
}

function guessContentType(key: string): string {
  if (key.endsWith(".pdf")) return "application/pdf";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export function localDriver(): StorageDriver {
  return {
    name: "local",

    async upload({ key, body }) {
      const target = resolveKey(key);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      return { key, sizeBytes: body.byteLength };
    },

    async download(key) {
      try {
        const body = await readFile(resolveKey(key));
        return { body, contentType: guessContentType(key) };
      } catch {
        return null;
      }
    },

    async remove(keys) {
      await Promise.all(
        keys.map(async (key) => {
          try {
            await unlink(resolveKey(key));
          } catch {
            // Already gone — deletion is idempotent.
          }
        }),
      );
    },

    async exists(key) {
      try {
        await stat(resolveKey(key));
        return true;
      } catch {
        return false;
      }
    },

    async signedUrl() {
      throw new Error(
        "The local storage driver cannot mint signed URLs. Certificate PDFs are " +
          "streamed through /api/certificates/[id]/pdf, which works on both drivers.",
      );
    },
  };
}

export const LOCAL_STORAGE_ROOT = ROOT;
export { join as joinStoragePath };
