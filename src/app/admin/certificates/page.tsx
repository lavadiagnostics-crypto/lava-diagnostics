import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import {
  CERTIFICATE_STATUS_META,
  CertificateStatusBadge,
  ResultBadge,
} from "@/components/shared/status";
import { StatTile } from "@/components/shared/stat-tile";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import type { CertificateStatus, Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "COA Library" };

const STATUS_FILTERS: (CertificateStatus | "ALL")[] = [
  "ALL",
  "PRIVATE",
  "VERIFIED",
  "REVOKED",
  "ARCHIVED",
];

const PAGE_SIZE = 25;

/**
 * Administrative COA library.
 *
 * This is the one place certificates are listed — and it is behind an admin
 * session. It is NOT a public directory: no route reachable without an
 * administrator session can enumerate certificates, and this page is `noindex`
 * via the admin layout plus the X-Robots-Tag header in next.config.ts.
 */
export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
    customerId?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const status =
    params.status &&
    STATUS_FILTERS.includes(params.status as CertificateStatus)
      ? (params.status as CertificateStatus | "ALL")
      : "ALL";

  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.CertificateWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(query
      ? {
          OR: [
            { certificateNumber: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { product: { contains: query, mode: "insensitive" } },
            { batchNumber: { contains: query, mode: "insensitive" } },
            { lotNumber: { contains: query, mode: "insensitive" } },
            { order: { orderNumber: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [certificates, total, counts] = await Promise.all([
    prisma.certificate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        certificateNumber: true,
        customerName: true,
        product: true,
        batchNumber: true,
        result: true,
        status: true,
        issuedDate: true,
        viewCount: true,
        revision: true,
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.certificate.count({ where }),
    prisma.certificate.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(next: Record<string, string | undefined>): string {
    const search = new URLSearchParams();
    const merged = {
      status,
      q: query || undefined,
      customerId: params.customerId,
      page: String(page),
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "ALL" && !(key === "page" && value === "1")) {
        search.set(key, value);
      }
    }
    const qs = search.toString();
    return qs ? `/admin/certificates?${qs}` : "/admin/certificates";
  }

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        overline="Administration"
        title="COA Library"
        description="Upload, release, revoke and manage Certificates of Analysis."
        action={
          <Button asChild>
            <Link href="/admin/certificates/new">
              <Plus aria-hidden />
              Upload COA
            </Link>
          </Button>
        }
      />

      {/* ── Privacy reminder ── */}
      <Card className="mt-8 border-lava-200 bg-lava-50/45 p-5 dark:border-lava-900/70 dark:bg-lava-950/20">
        <div className="flex gap-3.5">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-lava-600 dark:text-lava-400"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed">
            <strong className="font-semibold">
              This library is visible to administrators only.
            </strong>{" "}
            Certificates are private by default — a{" "}
            <strong className="font-semibold">Private</strong> certificate
            verifies as &ldquo;not found&rdquo; for everyone, including its own
            client. Releasing a certificate is what makes it reachable by anyone
            holding its number or QR code.
          </p>
        </div>
      </Card>

      {/* ── Stats ── */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(["PRIVATE", "VERIFIED", "REVOKED", "ARCHIVED"] as const).map(
          (statusKey) => {
            const meta = CERTIFICATE_STATUS_META[statusKey];
            return (
              <StatTile
                key={statusKey}
                label={meta.label}
                value={countByStatus.get(statusKey) ?? 0}
                icon={meta.icon}
                tone={
                  statusKey === "VERIFIED"
                    ? "pass"
                    : statusKey === "REVOKED"
                      ? "fail"
                      : statusKey === "PRIVATE"
                        ? "pending"
                        : "default"
                }
              />
            );
          },
        )}
      </div>

      {/* ── Filters ── */}
      <div className="mt-8 space-y-4">
        <form action="/admin/certificates" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search certificate number, client, product, batch or lot…"
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-lava-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lava-500/20"
            aria-label="Search certificates"
          />
          {status !== "ALL" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter;
            const count =
              filter === "ALL"
                ? counts.reduce((sum, c) => sum + c._count, 0)
                : (countByStatus.get(filter) ?? 0);

            return (
              <Link
                key={filter}
                href={href({ status: filter, page: "1" })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "border-charcoal-900 bg-charcoal-900 text-white dark:border-white dark:bg-white dark:text-charcoal-900"
                    : "border-border text-muted-foreground hover:border-lava-200 hover:text-foreground dark:hover:border-lava-900",
                )}
              >
                {filter === "ALL"
                  ? "All"
                  : CERTIFICATE_STATUS_META[filter].label}
                <span className="tabular opacity-60">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Upload}
          title={
            query || status !== "ALL"
              ? "No matching certificates"
              : "No certificates yet"
          }
          description={
            query || status !== "ALL"
              ? "Try a different search term or clear the status filter."
              : "Upload a completed PDF to create your first certificate. It stays private until you release it."
          }
          action={
            <Button asChild>
              <Link href="/admin/certificates/new">Upload a COA</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="mt-8 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/45 hover:bg-muted/45">
                  <TableHead className="pl-6">Certificate</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product / Batch</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/admin/certificates/${certificate.id}`}
                        className="group"
                      >
                        <span className="font-mono text-[13px] font-semibold group-hover:text-lava-600 dark:group-hover:text-lava-400">
                          {certificate.certificateNumber}
                        </span>
                        {certificate.revision > 1 ? (
                          <Badge variant="muted" className="ml-2">
                            r{certificate.revision}
                          </Badge>
                        ) : null}
                        {certificate.order ? (
                          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {certificate.order.orderNumber}
                          </p>
                        ) : null}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="truncate text-sm">
                        {certificate.customerName}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm font-medium">
                        {certificate.product}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {certificate.batchNumber}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                      {formatDate(certificate.issuedDate)}
                    </TableCell>
                    <TableCell>
                      <ResultBadge result={certificate.result} />
                    </TableCell>
                    <TableCell>
                      <CertificateStatusBadge status={certificate.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <span className="tabular inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Eye className="size-3.5" aria-hidden />
                        {certificate.viewCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-[13px] text-muted-foreground">
                Page {page} of {totalPages} · {total} certificate
                {total === 1 ? "" : "s"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={href({ page: String(page - 1) })}>Previous</Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <Link href={href({ page: String(page + 1) })}>Next</Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
