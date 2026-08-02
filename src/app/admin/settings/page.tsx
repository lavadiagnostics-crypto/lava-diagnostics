import type { Metadata } from "next";
import {
  AlertTriangle,
  Database,
  HardDrive,
  Mail,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField, SectionHeading } from "@/components/shared/empty-state";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { serverEnv, appUrl } from "@/lib/env";
import { EXPEDITE_SURCHARGE_PERCENT, TEST_CATALOG, VOLUME_TIERS } from "@/lib/pricing";
import { VERIFY_POLICY } from "@/lib/certificates/verify";
import { formatCents, formatDate } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = { title: "Settings" };

/**
 * Read-only configuration overview.
 *
 * Deliberately does not let an administrator change storage, email or hashing
 * configuration from the browser: those are deployment concerns, and a UI that
 * could repoint object storage or rotate the certificate hash secret would be a
 * serious escalation path. Values are shown so an operator can confirm what is
 * live without shell access; secrets are never rendered.
 */
export default async function AdminSettingsPage() {
  const { session } = await requireAdmin();
  const env = serverEnv();

  const [admins, certificateCount, oldestCertificate] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.certificate.count(),
    prisma.certificate.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const usingLocalStorage = env.STORAGE_DRIVER === "local";
  const usingConsoleEmail = env.EMAIL_DRIVER === "console";
  const hasRedis = Boolean(
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeading
        overline="Administration"
        title="Settings"
        description="Live configuration and laboratory reference data."
      />

      {/* ── Deployment warnings ── */}
      {usingLocalStorage || usingConsoleEmail || !hasRedis ? (
        <Card className="mt-8 border-[hsl(var(--pending)/0.4)] bg-[hsl(var(--pending)/0.06)] p-5">
          <div className="flex gap-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[hsl(var(--pending))]"
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold">
                Not fully configured for production
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {usingLocalStorage ? (
                  <li>
                    <strong className="font-semibold text-foreground">
                      Storage is local.
                    </strong>{" "}
                    Certificate PDFs are written to the server filesystem, which
                    is ephemeral on serverless hosts and not shared between
                    instances. Set <code className="font-mono">STORAGE_DRIVER=supabase</code> before going live.
                  </li>
                ) : null}
                {usingConsoleEmail ? (
                  <li>
                    <strong className="font-semibold text-foreground">
                      Email is console-only.
                    </strong>{" "}
                    Notifications are printed to the server log instead of being
                    delivered. Set <code className="font-mono">EMAIL_DRIVER=resend</code> with an API key.
                  </li>
                ) : null}
                {!hasRedis ? (
                  <li>
                    <strong className="font-semibold text-foreground">
                      No Redis configured.
                    </strong>{" "}
                    Rate limiting falls back to the database, which is correct
                    across instances but slower. Configure Upstash for higher
                    traffic.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="mt-8 space-y-6">
        {/* ── Runtime ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <Server className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Runtime configuration
            </h2>
          </div>
          <Separator className="my-5" />

          <dl className="grid gap-6 sm:grid-cols-2">
            <DataField label="Public URL" mono>
              {appUrl()}
            </DataField>
            <DataField label="Environment">
              <Badge
                variant={
                  process.env.NODE_ENV === "production" ? "pass" : "pending"
                }
              >
                {process.env.NODE_ENV}
              </Badge>
            </DataField>
            <DataField label="Storage driver">
              <span className="inline-flex items-center gap-2">
                <HardDrive className="size-3.5" aria-hidden />
                {env.STORAGE_DRIVER}
                {usingLocalStorage ? (
                  <Badge variant="pending">Development only</Badge>
                ) : (
                  <Badge variant="pass">Private bucket</Badge>
                )}
              </span>
            </DataField>
            <DataField label="Email driver">
              <span className="inline-flex items-center gap-2">
                <Mail className="size-3.5" aria-hidden />
                {env.EMAIL_DRIVER}
                {usingConsoleEmail ? (
                  <Badge variant="pending">Not delivering</Badge>
                ) : (
                  <Badge variant="pass">Live</Badge>
                )}
              </span>
            </DataField>
            <DataField label="Rate-limit backend">
              {hasRedis ? "Upstash Redis" : "PostgreSQL (fallback)"}
            </DataField>
            <DataField label="Sender address" mono>
              {env.EMAIL_FROM}
            </DataField>
          </dl>

          <p className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-[13px] leading-relaxed text-muted-foreground">
            These values come from environment variables and are deliberately not
            editable here. A settings screen that could repoint object storage or
            rotate the certificate hash secret would be an escalation path, not a
            convenience.
          </p>
        </Card>

        {/* ── Verification policy ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Verification policy
            </h2>
          </div>
          <Separator className="my-5" />

          <dl className="grid gap-6 sm:grid-cols-2">
            <DataField label="Certificate number alone">
              {VERIFY_POLICY.requireCodeWithNumber ? (
                <Badge variant="pass">Blocked — code also required</Badge>
              ) : (
                <Badge variant="primary">Permitted</Badge>
              )}
            </DataField>
            <DataField label="Failure lockout threshold">
              <span className="tabular">
                {VERIFY_POLICY.failureThreshold} failures per hour
              </span>
            </DataField>
            <DataField label="Lockout duration">
              <span className="tabular">
                {VERIFY_POLICY.lockoutSeconds / 3600} hours
              </span>
            </DataField>
            <DataField label="Certificates on record">
              <span className="tabular">{certificateCount}</span>
            </DataField>
          </dl>

          <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
            {VERIFY_POLICY.requireCodeWithNumber
              ? "Strict mode is active: a certificate number must be presented together with its verification code. QR scans are unaffected."
              : "A certificate number alone opens a released certificate, which is what a downstream buyer holding a printed label needs. Enumeration is prevented by the failure lockout above rather than by requiring a second factor. Set REQUIRE_CODE_WITH_NUMBER=true to require the code as well."}
          </p>
        </Card>

        {/* ── Administrators ── */}
        <Card className="p-6 sm:p-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Administrators
          </h2>
          <Separator className="my-5" />

          <ul className="divide-y divide-border">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {admin.name ?? admin.email}
                    {admin.id === session.user.id ? (
                      <span className="ml-2 text-[13px] font-normal text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {admin.email} · last sign-in{" "}
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : "never"}
                  </p>
                </div>
                <Badge variant={admin.isActive ? "pass" : "muted"}>
                  {admin.isActive ? "Active" : "Disabled"}
                </Badge>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
            Administrator accounts are created by the seed script or promoted
            directly in the database. There is no code path through which a
            self-registration can request the ADMIN role.
          </p>
        </Card>

        {/* ── Price list ── */}
        <Card className="p-6 sm:p-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Active price list
          </h2>
          <Separator className="my-5" />

          <ul className="divide-y divide-border">
            {TEST_CATALOG.map((test) => (
              <li
                key={test.key}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{test.label}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {test.method}
                  </p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold">
                  {test.priceCents === 0
                    ? "Free"
                    : `${formatCents(test.priceCents)}${test.perVial ? " / vial" : ""}`}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            {VOLUME_TIERS.map((tier) => (
              <Badge key={tier.minSamples} variant="outline">
                {tier.minSamples}+ samples −{tier.percent}%
              </Badge>
            ))}
            <Badge variant="outline">
              Expedite +{EXPEDITE_SURCHARGE_PERCENT}%
            </Badge>
          </div>

          <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
            The price list lives in{" "}
            <code className="font-mono">src/lib/pricing.ts</code> and is the single
            source of truth for the submission form, the public pricing page and
            server-side invoice generation. Editing it changes all three at once.
          </p>
        </Card>

        {/* ── Data retention ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <Database className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Data & retention
            </h2>
          </div>
          <Separator className="my-5" />

          <dl className="grid gap-6 sm:grid-cols-2">
            <DataField label="Laboratory">{BRAND.name}</DataField>
            <DataField label="Oldest certificate">
              {oldestCertificate
                ? formatDate(oldestCertificate.createdAt)
                : "—"}
            </DataField>
            <DataField label="Certificate retention">7 years minimum</DataField>
            <DataField label="Verification log retention">12 months</DataField>
          </dl>
        </Card>
      </div>
    </div>
  );
}
