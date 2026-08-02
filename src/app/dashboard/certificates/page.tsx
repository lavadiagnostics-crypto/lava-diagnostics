import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import { ResultBadge } from "@/components/shared/status";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificates" };

/**
 * The client's own certificates.
 *
 * This is NOT a public directory — it is scoped strictly to the signed-in
 * customer, and unreleased (PRIVATE) certificates are shown as pending without a
 * link, because they are not yet verifiable by anyone.
 */
export default async function CustomerCertificatesPage() {
  const { customerId } = await requireCustomer("/dashboard/certificates");

  const certificates = await prisma.certificate.findMany({
    where: {
      customerId,
      // ARCHIVED revisions are superseded and would only confuse the client.
      status: { in: ["VERIFIED", "PRIVATE", "REVOKED"] },
    },
    orderBy: [{ issuedDate: "desc" }],
    select: {
      id: true,
      certificateNumber: true,
      verificationToken: true,
      product: true,
      batchNumber: true,
      lotNumber: true,
      result: true,
      status: true,
      issuedDate: true,
      purityResult: true,
      order: { select: { orderNumber: true } },
    },
  });

  const released = certificates.filter((c) => c.status === "VERIFIED");
  const pending = certificates.filter((c) => c.status === "PRIVATE");
  const revoked = certificates.filter((c) => c.status === "REVOKED");

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        overline="Client Portal"
        title="Certificates"
        description="Your Certificates of Analysis. Share a certificate number or QR code and anyone can verify it independently."
      />

      {certificates.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={ShieldCheck}
          title="No certificates yet"
          description="Certificates appear here as soon as your results have been reviewed, signed and released by the laboratory."
          action={
            <Button asChild>
              <Link href="/submit">Submit samples</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-9 space-y-10">
          {/* ── Released ── */}
          {released.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                Released
                <span className="tabular ml-2 text-sm font-normal text-muted-foreground">
                  {released.length}
                </span>
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {released.map((certificate) => (
                  <Card key={certificate.id} interactive className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold tracking-tight">
                          {certificate.product}
                        </h3>
                        <p className="mt-1 truncate font-mono text-[13px] text-muted-foreground">
                          {certificate.certificateNumber}
                        </p>
                      </div>
                      <ResultBadge result={certificate.result} />
                    </div>

                    <dl className="mt-5 flex-1 space-y-2 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Batch</dt>
                        <dd className="truncate font-mono">
                          {certificate.batchNumber}
                        </dd>
                      </div>
                      {certificate.purityResult ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Purity</dt>
                          <dd className="tabular font-semibold">
                            {Number(certificate.purityResult).toFixed(2)}%
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Issued</dt>
                        <dd>{formatDate(certificate.issuedDate)}</dd>
                      </div>
                      {certificate.order ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Order</dt>
                          <dd className="truncate font-mono">
                            {certificate.order.orderNumber}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-6 flex gap-2 border-t border-border pt-5">
                      <Button size="sm" asChild className="flex-1">
                        <Link href={`/verify/${certificate.verificationToken}`}>
                          <ExternalLink aria-hidden />
                          View
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`/api/certificates/${certificate.id}/pdf?download=1`}
                          download={`${certificate.certificateNumber}.pdf`}
                          aria-label={`Download ${certificate.certificateNumber}`}
                        >
                          <Download aria-hidden />
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Pending release ── */}
          {pending.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                Awaiting release
                <span className="tabular ml-2 text-sm font-normal text-muted-foreground">
                  {pending.length}
                </span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                These certificates are in final review. They are not yet
                verifiable by anyone, including you, until the reviewing analyst
                signs them off.
              </p>

              <ul className="mt-5 space-y-3">
                {pending.map((certificate) => (
                  <li
                    key={certificate.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-muted/25 p-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-tight">
                        {certificate.product}
                      </p>
                      <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                        batch {certificate.batchNumber}
                      </p>
                    </div>
                    <Badge variant="pending" className="shrink-0">
                      <Clock aria-hidden />
                      In review
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ── Revoked ── */}
          {revoked.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                Revoked
                <span className="tabular ml-2 text-sm font-normal text-muted-foreground">
                  {revoked.length}
                </span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                These certificates have been withdrawn. Any copies in circulation
                should be treated as void.
              </p>

              <ul className="mt-5 space-y-3">
                {revoked.map((certificate) => (
                  <li key={certificate.id}>
                    <Link
                      href={`/verify/${certificate.verificationToken}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.035] p-5 transition-opacity hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold tracking-tight">
                          {certificate.product}
                        </p>
                        <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                          {certificate.certificateNumber}
                        </p>
                      </div>
                      <Badge variant="fail" className="shrink-0">
                        Revoked
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
