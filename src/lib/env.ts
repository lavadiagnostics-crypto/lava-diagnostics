import { z } from "zod";

/**
 * Validated server-side environment.
 *
 * Parsed lazily so that `next build` does not require production secrets to be
 * present for pages that never touch them, but any code path that actually
 * reads a secret fails loudly and immediately rather than silently degrading.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  CERTIFICATE_HASH_SECRET: z
    .string()
    .min(16, "CERTIFICATE_HASH_SECRET must be at least 16 characters"),

  STORAGE_DRIVER: z.enum(["supabase", "local"]).default("local"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("lava-certificates"),

  EMAIL_DRIVER: z.enum(["resend", "console"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("LAVA Diagnostics <no-reply@lavadiagnostics.com>"),
  EMAIL_REPLY_TO: z.string().optional(),
  EMAIL_INTERNAL_INBOX: z.string().default("lab@lavadiagnostics.com"),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment. Check your .env against .env.example:\n${issues}`,
    );
  }

  // Cross-field requirements the flat schema can't express.
  const env = parsed.data;
  if (env.STORAGE_DRIVER === "supabase") {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
  }
  if (env.EMAIL_DRIVER === "resend" && !env.RESEND_API_KEY) {
    throw new Error("EMAIL_DRIVER=resend requires RESEND_API_KEY.");
  }

  cached = env;
  return cached;
}

/**
 * Canonical public origin, without a trailing slash. Safe to read on the client.
 * Used for QR payloads and links in outbound email, so it must match the
 * deployed domain exactly.
 */
export function appUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}
