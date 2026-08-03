import { headers } from "next/headers";
import { hashIp } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Append-only audit trail.
 *
 * Every privileged mutation records who did what to which record. Logging must
 * never break the operation it is describing, so failures are swallowed after
 * being reported to stderr - a dropped log line is preferable to a failed
 * certificate release, and the alternative (throwing) would let an attacker
 * block admin actions by inducing log errors.
 */

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "order.created"
  | "order.status_changed"
  | "order.updated"
  | "order.notes_updated"
  | "certificate.created"
  | "certificate.pdf_replaced"
  | "certificate.metadata_updated"
  | "certificate.released"
  | "certificate.made_private"
  | "certificate.revoked"
  | "certificate.archived"
  | "certificate.deleted"
  | "certificate.asset_uploaded"
  | "certificate.viewed"
  | "certificate.verification_failed"
  | "invoice.created"
  | "invoice.status_changed"
  | "customer.created"
  | "customer.updated"
  | "message.replied"
  | "message.status_changed";

export interface AuditInput {
  action: AuditAction;
  userId?: string | null;
  actorEmail?: string | null;
  entity?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

/** Best-effort client IP from the proxy chain. */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]!.trim();
    return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? null;
  } catch {
    return null;
  }
}

async function requestContext() {
  try {
    const h = await headers();
    return {
      ipHash: hashIp(await clientIp()),
      userAgent: h.get("user-agent")?.slice(0, 400) ?? null,
    };
  } catch {
    return { ipHash: null, userAgent: null };
  }
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const { ipHash, userAgent } = await requestContext();
    await prisma.activityLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        actorEmail: input.actorEmail ?? null,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
        ipHash,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", input.action, error);
  }
}
