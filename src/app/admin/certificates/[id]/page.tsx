import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  ExternalLink,
  Fingerprint,
  KeyRound,
  QrCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import {
  CertificateStatusBadge,
  ResultBadge,
} from "@/components/shared/status";
import { LifecycleControls } from "@/app/admin/certificates/[id]/lifecycle-controls";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { verificationUrl } from "@/lib/qr";
import { chunkHash, formatBytes, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificate" };

export default async function AdminCertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, companyName: true, email: true } },
      order: { select: { id: true, orderNumber: true } },
      sample: { select: { sampleCode: true } },
      accessLogs: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          method: true,
          success: true,
          createdAt: true,
          queryFragment: true,
        },
      },
    },
  });

  if (!certificate) notFound();

  const hashGroups = chunkHash(certificate.hash, 8);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/certificates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        COA Library
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
              {certificate.certificateNumber}
            </h1>
            {certificate.revision > 1 ? (
              <Badge variant="muted">Revision {certificate.revision}</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {certificate.product} · batch {certificate.batchNumber} ·{" "}
            {certificate.customer.companyName}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <div className="flex gap-2">
            <CertificateStatusBadge status={certificate.status} />
            <ResultBadge result={certificate.result} />
          </div>
          {certificate.status === "VERIFIED" ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/verify/${certificate.verificationToken}`}
                target="_blank"
              >
                <ExternalLink aria-hidden />
                View as client sees it
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* ── Metadata ── */}
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">
              Certificate metadata
            </h2>
            <Separator className="my-5" />

            <dl className="grid gap-6 sm:grid-cols-2">
              <DataField label="Issued to">
                <Link
                  href={`/admin/customers/${certificate.customer.id}`}
                  className="hover:text-lava-600 dark:hover:text-lava-400"
                >
                  {certificate.customerName}
                </Link>
              </DataField>
              <DataField label="Client email">
                {certificate.customer.email}
              </DataField>
              <DataField label="Product">{certificate.product}</DataField>
              <DataField label="Batch number" mono>
                {certificate.batchNumber}
              </DataField>
              <DataField label="Lot number" mono>
                {certificate.lotNumber || "—"}
              </DataField>
              <DataField label="Issue date">
                {formatDate(certificate.issuedDate)}
              </DataField>
              <DataField label="Purity result">
                {certificate.purityResult
                  ? `${Number(certificate.purityResult).toFixed(2)}%`
                  : "—"}
              </DataField>
              <DataField label="Net content">
                {certificate.contentResult
                  ? `${Number(certificate.contentResult).toFixed(2)} mg`
                  : "—"}
              </DataField>
              <DataField label="Order">
                {certificate.order ? (
                  <Link
                    href={`/admin/orders/${certificate.order.id}`}
                    className="font-mono text-sm hover:text-lava-600 dark:hover:text-lava-400"
                  >
                    {certificate.order.orderNumber}
                  </Link>
                ) : (
                  "—"
                )}
              </DataField>
              <DataField label="Sample" mono>
                {certificate.sample?.sampleCode || "—"}
              </DataField>
              <DataField label="Approved by">
                {certificate.signedBy || "—"}
                {certificate.signedTitle ? (
                  <span className="block text-[13px] font-normal text-muted-foreground">
                    {certificate.signedTitle}
                  </span>
                ) : null}
              </DataField>
              <DataField label="Released">
                {certificate.releasedAt
                  ? formatDateTime(certificate.releasedAt)
                  : "Not yet released"}
              </DataField>
            </dl>

            {certificate.testedFor.length > 0 ? (
              <div className="mt-6 border-t border-border pt-6">
                <p className="overline mb-3">Analyses listed on the COA</p>
                <div className="flex flex-wrap gap-2">
                  {certificate.testedFor.map((test) => (
                    <Badge key={test} variant="outline">
                      {test}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {certificate.summary ? (
              <div className="mt-6 border-t border-border pt-6">
                <p className="overline mb-2.5">Laboratory summary</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {certificate.summary}
                </p>
              </div>
            ) : null}

            {certificate.internalNotes ? (
              <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
                <p className="overline mb-2">
                  Internal notes — never shown to the client
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {certificate.internalNotes}
                </p>
              </div>
            ) : null}

            {certificate.status === "REVOKED" &&
            certificate.revocationReason ? (
              <div className="mt-6 rounded-2xl border border-destructive/35 bg-destructive/[0.05] p-4">
                <p className="overline mb-2 text-destructive">
                  Revocation reason — shown publicly
                </p>
                <p className="text-[13px] leading-relaxed">
                  {certificate.revocationReason}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Revoked {formatDateTime(certificate.revokedAt)}
                </p>
              </div>
            ) : null}
          </Card>

          {/* ── Document ── */}
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">Document</h2>
            <Separator className="my-5" />

            <div className="overflow-hidden rounded-2xl border border-border">
              {/*
                Admins are authorised by the PDF route via their session, so the
                same proxy endpoint serves this preview — no separate code path,
                and no signed storage URL in the markup.
              */}
              <iframe
                src={`/api/certificates/${certificate.id}/pdf`}
                title={`Certificate ${certificate.certificateNumber}`}
                className="h-[520px] w-full bg-white"
                sandbox="allow-same-origin"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/api/certificates/${certificate.id}/pdf?download=1`}
                  download={`${certificate.certificateNumber}.pdf`}
                >
                  <Download aria-hidden />
                  Download
                </a>
              </Button>
              <span className="inline-flex items-center text-[13px] text-muted-foreground">
                Revision {certificate.revision} ·{" "}
                {formatBytes(certificate.pdfSizeBytes)}
              </span>
            </div>

            {certificate.chromatogramPaths.length > 0 ||
            certificate.spectrumPaths.length > 0 ? (
              <div className="mt-6 border-t border-border pt-6">
                <p className="overline mb-3">Attached raw data</p>
                <div className="flex flex-wrap gap-2">
                  {certificate.chromatogramPaths.map((path) => (
                    <Badge key={path} variant="muted">
                      Chromatogram: {path.split("/").pop()}
                    </Badge>
                  ))}
                  {certificate.spectrumPaths.map((path) => (
                    <Badge key={path} variant="muted">
                      Spectrum: {path.split("/").pop()}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          {/* ── Access log ── */}
          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5">
              <Eye className="size-4 text-lava-500" aria-hidden />
              <h2 className="text-lg font-semibold tracking-tight">
                Verification activity
              </h2>
            </div>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {certificate.viewCount} successful lookup
              {certificate.viewCount === 1 ? "" : "s"} in total
              {certificate.lastViewedAt
                ? ` · last ${formatDateTime(certificate.lastViewedAt)}`
                : ""}
            </p>
            <Separator className="my-5" />

            {certificate.accessLogs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No verification attempts recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {certificate.accessLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">
                        {log.method.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                    <Badge variant={log.success ? "pass" : "muted"}>
                      {log.success ? "Success" : "Failed"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              IP addresses are stored only as keyed one-way hashes, so this log
              shows patterns of access without recording who viewed a certificate.
            </p>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Lifecycle
            </h2>
            <Separator className="my-5" />
            <LifecycleControls
              certificateId={certificate.id}
              certificateNumber={certificate.certificateNumber}
              status={certificate.status}
              revision={certificate.revision}
              pdfSizeBytes={certificate.pdfSizeBytes}
            />
          </Card>

          {/* ── QR & token ── */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <QrCode className="size-4 text-lava-500" aria-hidden />
              <h2 className="text-base font-semibold tracking-tight">
                QR & verification
              </h2>
            </div>
            <Separator className="my-5" />

            {certificate.qrCode ? (
              <div className="mx-auto w-40 rounded-2xl border border-border bg-white p-3">
                {/* Data URL generated server-side by the qrcode library. */}
                <Image
                  src={certificate.qrCode}
                  alt={`QR code for ${certificate.certificateNumber}`}
                  width={512}
                  height={512}
                  className="size-full"
                  unoptimized
                />
              </div>
            ) : null}

            <div className="mt-5">
              <p className="overline mb-2">Verification URL</p>
              <p className="break-all rounded-xl bg-muted px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {verificationUrl(certificate.verificationToken)}
              </p>
            </div>

            <div className="mt-5">
              <p className="overline mb-2 flex items-center gap-1.5">
                <KeyRound className="size-3" aria-hidden />
                Verification token
              </p>
              <p className="break-all rounded-xl border border-lava-200 bg-lava-50/60 px-3 py-2.5 font-mono text-[11px] leading-relaxed dark:border-lava-900/70 dark:bg-lava-950/25">
                {certificate.verificationToken}
              </p>
              <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <Copy className="mt-0.5 size-3 shrink-0" aria-hidden />
                Treat as a secret. Anyone holding this token can open the
                certificate, so only send it to the client.
              </p>
            </div>
          </Card>

          {/* ── Hash ── */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="size-4 text-lava-500" aria-hidden />
              <h2 className="text-base font-semibold tracking-tight">
                Integrity hash
              </h2>
            </div>
            <Separator className="my-5" />

            <div className="rounded-xl bg-muted p-3">
              <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {hashGroups.map((group, index) => (
                  <span key={index}>{group}</span>
                ))}
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              HMAC-SHA256 over the certificate&apos;s immutable fields and the PDF
              bytes. Replacing the document changes this value.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
