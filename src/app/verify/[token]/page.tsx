import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Fingerprint,
  Hash,
  PenTool,
  QrCode,
  ScanLine,
  SearchX,
  ShieldAlert,
  ShieldOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal } from "@/components/shared/motion";
import { ResultStamp } from "@/components/shared/status";
import { PdfViewer } from "@/app/verify/[token]/pdf-viewer";
import {
  certificateFromActiveGrant,
  verifyCertificate,
} from "@/lib/certificates/verify";
import { prisma } from "@/lib/prisma";
import { generateQrSvg, verificationUrl } from "@/lib/qr";
import { chunkHash, formatDate } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

/**
 * Certificate verification result page.
 *
 * Reached by a QR scan, by the COA-ready email link, or by redirect from the
 * search form. This is the ONLY place a certificate is rendered.
 *
 * `force-dynamic` is essential: caching this page would serve one client's
 * certificate to whoever requested it next.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Certificate Verification",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

/** Shown for a token that does not resolve, or resolves to something unreleased. */
function NotFoundPanel() {
  return (
    <div className="container py-16 sm:py-24">
      <Reveal className="mx-auto max-w-xl">
        <Card className="border-destructive/35 bg-destructive/[0.045] p-8 sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <SearchX className="size-6" aria-hidden />
          </span>

          <h1 className="mt-7 text-2xl font-semibold tracking-tight text-destructive sm:text-3xl">
            Certificate Not Found
          </h1>

          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              This reference does not correspond to any certificate released by{" "}
              {BRAND.name}.
            </p>
            <p>
              If you scanned a QR code from a printed document, the document is
              not one of ours. If you followed a link, it may have been
              mistranscribed — check for missing or altered characters.
            </p>
            <p>
              We do not maintain any unlisted register that a genuine certificate
              could be hiding in. A reference that does not resolve here does not
              exist in our records.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/verify">
                <ScanLine aria-hidden />
                Try another reference
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Report a suspicious document</Link>
            </Button>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

function RateLimitedPanel({ retryAfterSeconds }: { retryAfterSeconds: number }) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return (
    <div className="container py-16 sm:py-24">
      <Reveal className="mx-auto max-w-xl">
        <Card className="border-[hsl(var(--pending)/0.4)] bg-[hsl(var(--pending)/0.06)] p-8 sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[hsl(var(--pending)/0.13)] text-[hsl(var(--pending))]">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <h1 className="mt-7 text-2xl font-semibold tracking-tight sm:text-3xl">
            Too many verification attempts
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            Verification is rate-limited to protect our clients&apos; certificates
            from bulk lookup. Please try again in about {minutes}{" "}
            {minutes === 1 ? "minute" : "minutes"}.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/contact">Contact the laboratory</Link>
          </Button>
        </Card>
      </Reveal>
    </div>
  );
}

export default async function VerifyTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  /*
   * Two-stage resolution.
   *
   * If this visitor already holds a valid grant for the certificate this token
   * belongs to — typically because they just verified and are refreshing, or
   * arrived via the search-form redirect — reuse it. That avoids consuming a
   * rate-limit slot and avoids double-counting the view.
   *
   * The lookup here is by token, which is the bearer secret, so reusing a grant
   * cannot widen access: the visitor already had to present the token.
   */
  const existing = await prisma.certificate.findUnique({
    where: { verificationToken: token },
    select: { id: true },
  });

  let certificate = existing
    ? await certificateFromActiveGrant(existing.id)
    : null;

  if (!certificate) {
    const outcome = await verifyCertificate({ token });

    if (outcome.status === "RATE_LIMITED") {
      return (
        <RateLimitedPanel retryAfterSeconds={outcome.retryAfterSeconds} />
      );
    }
    if (outcome.status === "NOT_FOUND" || outcome.status === "CODE_REQUIRED") {
      return <NotFoundPanel />;
    }

    if (outcome.status === "REVOKED") {
      const revoked = outcome.certificate;
      return (
        <div className="container py-16 sm:py-24">
          <Reveal className="mx-auto max-w-2xl">
            <Card className="border-destructive/40 bg-destructive/[0.045] p-8 sm:p-10">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldOff className="size-6" aria-hidden />
              </span>

              <Badge variant="fail" size="lg" className="mt-7">
                Revoked
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                This certificate has been withdrawn
              </h1>

              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                Certificate {revoked.certificateNumber} was issued by{" "}
                {BRAND.name} but has since been revoked. Any printed or digital
                copy you hold should be treated as void, and the results it
                states should not be relied upon.
              </p>

              {revoked.revocationReason ? (
                <div className="mt-7 rounded-2xl border border-border bg-background p-5">
                  <p className="overline mb-2">Reason for revocation</p>
                  <p className="text-[15px] leading-relaxed">
                    {revoked.revocationReason}
                  </p>
                </div>
              ) : null}

              <dl className="mt-7 grid gap-6 border-t border-border pt-7 sm:grid-cols-2">
                <DataField label="Certificate number" mono>
                  {revoked.certificateNumber}
                </DataField>
                <DataField label="Product">{revoked.product}</DataField>
                <DataField label="Batch number" mono>
                  {revoked.batchNumber}
                </DataField>
                <DataField label="Revoked on">
                  {formatDate(revoked.revokedAt)}
                </DataField>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" asChild>
                  <Link href="/verify">
                    <ArrowLeft aria-hidden />
                    Verify another certificate
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Query this revocation</Link>
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      );
    }

    certificate = outcome.certificate;
  }

  // ── Verified certificate ──
  const qrSvg = await generateQrSvg(certificate.verificationToken);

  const order = certificate.orderId
    ? await prisma.order.findUnique({
        where: { id: certificate.orderId },
        select: { orderNumber: true },
      })
    : null;

  const hashGroups = chunkHash(certificate.hash, 8);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-muted/35">
        <MoleculeBackground className="opacity-30 dark:opacity-20" />
        <div className="container relative py-12 sm:py-16">
          <Reveal className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Badge variant="pass" size="lg" className="mb-5">
                  <BadgeCheck aria-hidden />
                  Verified — issued by {BRAND.name}
                </Badge>
                <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                  {certificate.certificateNumber}
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  This certificate is genuine and currently valid. The details
                  below are served from our records, not from any document you
                  were sent.
                </p>
              </div>

              <div className="shrink-0">
                <ResultStamp result={certificate.result} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-10">
            {/* ── PDF ── */}
            <Reveal className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">
                Certificate document
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                The signed Certificate of Analysis as issued.
              </p>
              <div className="mt-5">
                <PdfViewer
                  certificateId={certificate.id}
                  certificateNumber={certificate.certificateNumber}
                  verificationToken={certificate.verificationToken}
                />
              </div>
            </Reveal>

            {/* ── Metadata ── */}
            <Reveal delay={0.08} className="min-w-0">
              <Card className="p-7">
                <h2 className="text-lg font-semibold tracking-tight">
                  Certificate details
                </h2>

                <dl className="mt-6 space-y-6">
                  <DataField label="Issued to">
                    <span className="flex items-start gap-2">
                      <Building2
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      {certificate.customerName}
                    </span>
                  </DataField>

                  <DataField label="Product">{certificate.product}</DataField>

                  <DataField label="Batch number" mono>
                    {certificate.batchNumber}
                  </DataField>

                  {certificate.lotNumber ? (
                    <DataField label="Lot number" mono>
                      {certificate.lotNumber}
                    </DataField>
                  ) : null}

                  <DataField label="Date issued">
                    <span className="flex items-center gap-2">
                      <CalendarDays
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      {formatDate(certificate.issuedDate)}
                    </span>
                  </DataField>

                  {order ? (
                    <DataField label="Order reference" mono>
                      {order.orderNumber}
                    </DataField>
                  ) : null}

                  {certificate.purityResult ? (
                    <DataField label="Purity (RP-HPLC)">
                      <span className="tabular">
                        {Number(certificate.purityResult).toFixed(2)}%
                      </span>
                    </DataField>
                  ) : null}

                  {certificate.contentResult ? (
                    <DataField label="Net peptide content">
                      <span className="tabular">
                        {Number(certificate.contentResult).toFixed(2)} mg
                      </span>
                    </DataField>
                  ) : null}
                </dl>

                {certificate.testedFor.length > 0 ? (
                  <>
                    <Separator className="my-6" />
                    <p className="overline mb-3">Analyses performed</p>
                    <div className="flex flex-wrap gap-2">
                      {certificate.testedFor.map((test) => (
                        <Badge key={test} variant="outline">
                          {test}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}

                {certificate.summary ? (
                  <>
                    <Separator className="my-6" />
                    <p className="overline mb-2.5">Laboratory summary</p>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      {certificate.summary}
                    </p>
                  </>
                ) : null}

                {certificate.signedBy ? (
                  <>
                    <Separator className="my-6" />
                    <p className="overline mb-3">Digital signature</p>
                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/45 p-4">
                      <PenTool
                        className="mt-0.5 size-4 shrink-0 text-lava-500"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {certificate.signedBy}
                        </p>
                        {certificate.signedTitle ? (
                          <p className="mt-0.5 text-[13px] text-muted-foreground">
                            {certificate.signedTitle}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          Approved and released on{" "}
                          {formatDate(certificate.releasedAt ?? certificate.issuedDate)}.
                          Reviewed by a second analyst prior to release.
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}
              </Card>

              {/* ── QR ── */}
              <Card className="mt-6 p-7">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-lava-500" aria-hidden />
                  <h2 className="text-base font-semibold tracking-tight">
                    QR verification
                  </h2>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  This code resolves to this certificate and nothing else.
                  Anyone can scan it to reach this page independently.
                </p>

                <div
                  className="mx-auto mt-6 w-40 rounded-2xl border border-border bg-white p-4 [&_svg]:size-full"
                  // Generated server-side by the `qrcode` library from our own
                  // token — not user input, so there is nothing to inject.
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  role="img"
                  aria-label={`QR code linking to certificate ${certificate.certificateNumber}`}
                />

                <p className="mt-5 break-all rounded-xl bg-muted px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {verificationUrl(certificate.verificationToken)}
                </p>
              </Card>

              {/* ── Hash ── */}
              <Card className="mt-6 p-7">
                <div className="flex items-center gap-2">
                  <Fingerprint className="size-4 text-lava-500" aria-hidden />
                  <h2 className="text-base font-semibold tracking-tight">
                    Certificate hash
                  </h2>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  A keyed fingerprint computed over this certificate&apos;s
                  immutable fields and the document bytes at the moment of issue.
                  If a copy you hold differs from the document above, this hash is
                  how you prove it.
                </p>

                <div className="mt-5 rounded-xl bg-muted p-3.5">
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {hashGroups.map((group, i) => (
                      <span key={i}>{group}</span>
                    ))}
                  </div>
                </div>

                <dl className="mt-5 space-y-3 border-t border-border pt-5 text-[13px]">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Algorithm</dt>
                    <dd className="font-mono">HMAC-SHA256</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Revision</dt>
                    <dd className="tabular font-medium">
                      {certificate.revision}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant="pass">Valid</Badge>
                    </dd>
                  </div>
                </dl>
              </Card>
            </Reveal>
          </div>

          {/* ── Footer note ── */}
          <Reveal className="mt-12" delay={0.14}>
            <Card className="bg-muted/45 p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Hash className="size-4 text-muted-foreground" aria-hidden />
                    <h2 className="text-base font-semibold tracking-tight">
                      What this verification does and does not confirm
                    </h2>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    This page confirms that {BRAND.name} issued this certificate,
                    to the named party, for the stated product and batch, with the
                    result shown. It describes the sample we received on the date
                    stated, under the methods stated.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    It does not extend to other units of the same batch, to
                    material stored or handled differently, or to material since
                    opened or repackaged. It is not a safety assessment and is not
                    an authorisation for human or veterinary use.
                  </p>
                </div>

                <Button variant="outline" asChild className="shrink-0">
                  <Link href="/verify">
                    <ArrowLeft aria-hidden />
                    Verify another
                  </Link>
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  );
}
