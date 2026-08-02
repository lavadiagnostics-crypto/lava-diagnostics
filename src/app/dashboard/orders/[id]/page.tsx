import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import { OrderTimeline } from "@/components/shared/order-timeline";
import {
  OrderStatusBadge,
  ResultBadge,
} from "@/components/shared/status";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";
import { TEST_CATALOG } from "@/lib/pricing";

export const metadata: Metadata = { title: "Order details" };

/** Maps a Sample row's boolean columns back to catalogue entries. */
function selectedTests(sample: Record<string, unknown>) {
  const map: Record<string, string> = {
    purity: "testPurity",
    identity: "testIdentity",
    content: "testContent",
    sterility: "testSterility",
    endotoxin: "testEndotoxin",
    heavyMetals: "testHeavyMetals",
    residualSolvents: "testResidualSolvents",
    conformity: "testConformity",
    photo: "testPhoto",
  };
  return TEST_CATALOG.filter((test) => sample[map[test.key]] === true);
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { customerId } = await requireCustomer(`/dashboard/orders/${id}`);

  /*
   * Scoped by customerId as well as id. Without the customerId clause, a client
   * could read another client's order by guessing its cuid — the URL parameter
   * is untrusted input, and this is the check that makes it safe.
   */
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      samples: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      certificates: {
        where: { status: { in: ["VERIFIED", "REVOKED"] } },
        orderBy: { issuedDate: "desc" },
        select: {
          id: true,
          certificateNumber: true,
          verificationToken: true,
          product: true,
          batchNumber: true,
          result: true,
          issuedDate: true,
          status: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalCents: true,
          currency: true,
          dueDate: true,
        },
      },
    },
  });

  if (!order) notFound();

  const totalVials = order.samples.reduce(
    (sum, s) =>
      sum + s.quantity + (s.testSterility ? 1 : 0) + (s.testEndotoxin ? 1 : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All orders
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
              {order.orderNumber}
            </h1>
            {order.isExpedited ? (
              <Badge variant="primary">
                <Zap aria-hidden />
                Expedited
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Submitted {formatDate(order.submittedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <OrderStatusBadge status={order.status} />
          <Button variant="outline" size="sm" asChild>
            <Link href="/submit">
              <RotateCcw aria-hidden />
              Reorder
            </Link>
          </Button>
        </div>
      </div>

      {/* Rejection notice takes precedence over everything else. */}
      {order.status === "REJECTED" && order.rejectionReason ? (
        <Card className="mt-8 border-destructive/35 bg-destructive/[0.045] p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-destructive">
            This submission was not accepted
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {order.rejectionReason}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No charge has been raised. Contact the laboratory if you would like to
            resubmit with amended details.
          </p>
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link href="/contact">Contact the laboratory</Link>
          </Button>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* ── Certificates ── */}
          {order.certificates.length > 0 ? (
            <Card className="p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-lava-500" aria-hidden />
                <h2 className="text-lg font-semibold tracking-tight">
                  Certificates
                </h2>
              </div>
              <Separator className="my-5" />

              <ul className="space-y-3">
                {order.certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <Link
                      href={`/verify/${certificate.verificationToken}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4 transition-colors hover:border-lava-200 hover:bg-muted/45 dark:hover:border-lava-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {certificate.product}
                        </p>
                        <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                          {certificate.certificateNumber} · batch{" "}
                          {certificate.batchNumber}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {certificate.status === "REVOKED" ? (
                          <Badge variant="fail">Revoked</Badge>
                        ) : (
                          <ResultBadge result={certificate.result} />
                        )}
                        <ExternalLink
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* ── Samples ── */}
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">
              Samples & analyses
            </h2>
            <Separator className="my-5" />

            <ul className="space-y-4">
              {order.samples.map((sample, index) => {
                const tests = selectedTests(
                  sample as unknown as Record<string, unknown>,
                );

                return (
                  <li
                    key={sample.id}
                    className="rounded-2xl border border-border bg-muted/30 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold tracking-tight">
                          {index + 1}. {sample.productName}
                        </p>
                        <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                          {sample.sampleCode}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-sm font-semibold">
                        {formatCents(sample.lineTotalCents, order.currency)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                      <DataField label="Batch" mono>
                        {sample.batchNumber}
                      </DataField>
                      <DataField label="Strength">
                        {sample.strength || "—"}
                      </DataField>
                      <DataField label="Vials">
                        <span className="tabular">{sample.quantity}</span>
                      </DataField>
                    </dl>

                    {sample.expectedPeptide ? (
                      <p className="mt-4 text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Expected peptide:{" "}
                        </span>
                        {sample.expectedPeptide}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {tests.map((test) => (
                        <Badge key={test.key} variant="outline">
                          {test.shortLabel}
                        </Badge>
                      ))}
                    </div>

                    {sample.notes ? (
                      <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
                        {sample.notes}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {order.specialInstructions ? (
              <div className="mt-6 border-t border-border pt-6">
                <p className="overline mb-2">Your special instructions</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {order.specialInstructions}
                </p>
              </div>
            ) : null}
          </Card>

          {/* ── Invoices ── */}
          {order.invoices.length > 0 ? (
            <Card className="p-6 sm:p-7">
              <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
              <Separator className="my-5" />
              <ul className="space-y-3">
                {order.invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {formatCents(invoice.totalCents, invoice.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="mt-5" asChild>
                <Link href="/dashboard/invoices">All invoices</Link>
              </Button>
            </Card>
          ) : null}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold tracking-tight">Progress</h2>
            <Separator className="my-5" />
            <OrderTimeline status={order.status} events={order.events} />
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Order summary
            </h2>
            <Separator className="my-5" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular">
                  {formatCents(order.subtotalCents, order.currency)}
                </dd>
              </div>
              {order.discountCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[hsl(var(--pass))]">
                    Volume discount ({order.discountPercent}%)
                  </dt>
                  <dd className="tabular text-[hsl(var(--pass))]">
                    −{formatCents(order.discountCents, order.currency)}
                  </dd>
                </div>
              ) : null}
              {order.expediteCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Expedited</dt>
                  <dd className="tabular">
                    +{formatCents(order.expediteCents, order.currency)}
                  </dd>
                </div>
              ) : null}
              {order.additionalCoaCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Additional COA names</dt>
                  <dd className="tabular">
                    +{formatCents(order.additionalCoaCents, order.currency)}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-5">
              <span className="text-sm font-semibold">Total</span>
              <span className="tabular text-xl font-semibold tracking-tight">
                {formatCents(order.totalCents, order.currency)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="outline">
                <Package aria-hidden />
                {totalVials} vial{totalVials === 1 ? "" : "s"}
              </Badge>
              <Badge variant="muted">{order.paymentMethod.replace("_", " ")}</Badge>
            </div>
          </Card>

          {order.trackingNumber ? (
            <Card className="p-6">
              <div className="flex items-center gap-2.5">
                <Truck className="size-4 text-lava-500" aria-hidden />
                <h2 className="text-base font-semibold tracking-tight">
                  Return shipment
                </h2>
              </div>
              <Separator className="my-5" />
              <dl className="space-y-4">
                {order.trackingCarrier ? (
                  <DataField label="Carrier">{order.trackingCarrier}</DataField>
                ) : null}
                <DataField label="Tracking number" mono>
                  {order.trackingNumber}
                </DataField>
                {order.shippedAt ? (
                  <DataField label="Dispatched">
                    {formatDate(order.shippedAt)}
                  </DataField>
                ) : null}
              </dl>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
