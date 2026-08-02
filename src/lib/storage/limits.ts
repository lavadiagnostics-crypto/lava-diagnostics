/**
 * Client-safe upload constraints.
 *
 * Deliberately a separate module from `@/lib/storage`: that barrel imports the
 * local driver, which imports `node:fs`, so any client component importing from
 * it drags Node built-ins into the browser bundle and fails the build.
 *
 * Upload forms import limits from HERE. Server code may import them from either
 * place — the storage barrel re-exports them.
 */

export const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Strips path traversal and shell-hostile characters from a client-supplied
 * filename before it becomes part of an object key.
 */
export function sanitiseFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return (
    base
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .slice(-120) || "file"
  );
}
