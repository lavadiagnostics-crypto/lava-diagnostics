import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { StorageDriver } from "@/lib/storage";

/**
 * Production storage driver backed by a PRIVATE Supabase Storage bucket.
 *
 * Uses the service-role key, which bypasses row-level security - it must never
 * be imported into client code. This module is server-only; `@supabase/supabase-js`
 * is only ever instantiated here.
 *
 * Bucket setup requirements are in the README: the bucket must be created with
 * `public = false`, and no RLS policy should grant `select` to `anon`.
 */

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const env = serverEnv();
  client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function bucket() {
  return getClient().storage.from(serverEnv().SUPABASE_STORAGE_BUCKET);
}

export function supabaseDriver(): StorageDriver {
  return {
    name: "supabase",

    async upload({ key, body, contentType }) {
      const { error } = await bucket().upload(key, body, {
        contentType,
        // Replacing a certificate PDF reuses its key under a new revision, so
        // upsert is safe and avoids an orphaned object on retry.
        upsert: true,
        cacheControl: "no-store",
      });
      if (error) {
        throw new Error(`Supabase upload failed for ${key}: ${error.message}`);
      }
      return { key, sizeBytes: body.byteLength };
    },

    async download(key) {
      const { data, error } = await bucket().download(key);
      if (error || !data) return null;
      const arrayBuffer = await data.arrayBuffer();
      return {
        body: Buffer.from(arrayBuffer),
        contentType: data.type || "application/octet-stream",
      };
    },

    async remove(keys) {
      if (keys.length === 0) return;
      const { error } = await bucket().remove(keys);
      if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
      }
    },

    async exists(key) {
      const path = key.split("/");
      const filename = path.pop()!;
      const { data, error } = await bucket().list(path.join("/"), {
        search: filename,
        limit: 1,
      });
      if (error) return false;
      return (data ?? []).some((item) => item.name === filename);
    },

    async signedUrl(key, expiresInSeconds) {
      const { data, error } = await bucket().createSignedUrl(
        key,
        expiresInSeconds,
      );
      if (error || !data?.signedUrl) {
        throw new Error(
          `Could not sign URL for ${key}: ${error?.message ?? "unknown error"}`,
        );
      }
      return data.signedUrl;
    },
  };
}
