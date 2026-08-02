import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Sliding-window rate limiting for public endpoints.
 *
 * Three tiers, chosen automatically:
 *
 *  1. Upstash Redis — correct across instances. Used when configured.
 *  2. Postgres — correct across instances, higher latency. Used as the fallback
 *     so that a multi-instance deployment without Redis is still protected.
 *  3. In-process Map — only when the database write itself fails, so that a
 *     transient DB error cannot become an open door.
 *
 * The verification endpoint is the primary consumer: without a limit here, an
 * attacker could grind certificate numbers even though they also need the
 * token.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the window frees up. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Identifier being limited, e.g. `verify:<ipHash>`. */
  key: string;
  limit: number;
  windowSeconds: number;
}

// ── Tier 3: in-process fallback ────────────────────────────────

const memoryBuckets = new Map<string, number[]>();

function memoryLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const hits = (memoryBuckets.get(key) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  memoryBuckets.set(key, hits);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (memoryBuckets.size > 5_000) {
    for (const [k, v] of memoryBuckets) {
      if (v.every((t) => t <= windowStart)) memoryBuckets.delete(k);
    }
  }

  return {
    success: hits.length <= limit,
    limit,
    remaining: Math.max(0, limit - hits.length),
    resetAt: (hits[0] ?? now) + windowSeconds * 1000,
  };
}

// ── Tier 1: Upstash Redis ─────────────────────────────────────

async function redisLimit(
  opts: RateLimitOptions,
  url: string,
  token: string,
): Promise<RateLimitResult | null> {
  const now = Date.now();
  const windowStart = now - opts.windowSeconds * 1000;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    // One pipeline round-trip: prune, add, count, set TTL.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", opts.key, "0", String(windowStart)],
        ["ZADD", opts.key, String(now), member],
        ["ZCARD", opts.key],
        ["EXPIRE", opts.key, String(opts.windowSeconds + 60)],
      ]),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const payload = (await res.json()) as { result: unknown }[];
    const count = Number(payload[2]?.result ?? 0);

    return {
      success: count <= opts.limit,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - count),
      resetAt: now + opts.windowSeconds * 1000,
    };
  } catch {
    return null;
  }
}

// ── Tier 2: Postgres ──────────────────────────────────────────

async function databaseLimit(
  opts: RateLimitOptions,
): Promise<RateLimitResult | null> {
  const now = Date.now();
  const windowStart = new Date(now - opts.windowSeconds * 1000);

  try {
    await prisma.rateLimitEntry.create({ data: { key: opts.key } });

    const count = await prisma.rateLimitEntry.count({
      where: { key: opts.key, createdAt: { gte: windowStart } },
    });

    // Sweep expired rows for this key roughly 1 call in 20 to bound table growth.
    if (Math.random() < 0.05) {
      await prisma.rateLimitEntry.deleteMany({
        where: { createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } },
      });
    }

    return {
      success: count <= opts.limit,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - count),
      resetAt: now + opts.windowSeconds * 1000,
    };
  } catch {
    return null;
  }
}

export async function rateLimit(
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const env = serverEnv();

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const result = await redisLimit(
      opts,
      env.UPSTASH_REDIS_REST_URL,
      env.UPSTASH_REDIS_REST_TOKEN,
    );
    if (result) return result;
  }

  const dbResult = await databaseLimit(opts);
  if (dbResult) return dbResult;

  return memoryLimit(opts);
}

/** Limits tuned for each public surface. */
export const RATE_LIMITS = {
  /** Certificate verification: generous for humans, hostile to enumeration. */
  verify: { limit: 12, windowSeconds: 60 },
  /** Longer window catches slow, distributed grinding. */
  verifyHourly: { limit: 80, windowSeconds: 60 * 60 },
  contact: { limit: 5, windowSeconds: 60 * 10 },
  submission: { limit: 10, windowSeconds: 60 * 30 },
  login: { limit: 8, windowSeconds: 60 * 5 },
} as const;
