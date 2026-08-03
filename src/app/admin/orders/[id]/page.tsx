import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import { OrderTimeline } from "@/components/shared/order-timeline";
import {
  CertificateStatusBadge,
  OrderStatusBadge,
} from "@/components/shared/status";
import { StatusControl } from "@/app/admin/orders/[id]/status-control";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";
import { TEST_CATALOG } from "@/lib/pricing";

export const metadata: Metadata = { title: "Order details" };

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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      samples: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      certificates: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          certificateNumber: true,
          product: true,
          batchNumber: true,
          status: true,
          result: true,
          issuedDate: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalCents: true,
          currency: true,
        },
      },
    },
  });

  if (!order) notFound();

  const requiredVials = order.samples.reduce(
    (sum, s) =>
      sum + s.quantity + (s.testSterility ? 1 : 0) + (s.testEndotoxin ? 1 : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/orders"
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
            {order.customer.companyName} · submitted{" "}
            {formatDate(order.submittedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <OrderStatusBadge status={order.status} />
          <Button size="sm" asChild>
            <Link href={`/admin/certificates/new?orderId=${order.id}`}>
              <Plus aria-hidden />
              Upload COA
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* ── Client ── */}
          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-4 text-lava-500" aria-hidden />
              <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
                Client
              </h2>
            </div>
            <Separator className="my-5" />

            <dl className="grid gap-6 sm:grid-cols-2">
              <DataField label="Certificate name">
                <span className="font-semibold">{order.customer.companyName}</span>
              </DataField>
              <DataField label="Contact">
                {order.customer.contactPerson}
              </DataField>
              <DataField label="Email">
                <a
                  href={`mailto:${order.customer.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-lava-600 dark:hover:text-lava-400"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  {order.customer.email}
                </a>
              </DataField>
              <DataField label="Phone">
                <a
                  href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 hover:text-lava-600 dark:hover:text-lava-400"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {order.customer.phone}
                </a>
              </DataField>
            </dl>

            <div className="mt-6 border-t border-border pt-6">
              <p className="overline mb-2.5 flex items-center gap-1.5">
                <MapPin className="size-3" aria-hidden />
                Shipping from
              </p>
              <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                {order.customer.shippingLine1}
                {order.customer.shippingLine2 ? (
                  <>
                    <br />
                    {order.customer.shippingLine2}
                  </>
                ) : null}
                <br />
                {order.customer.shippingCity}
                {order.customer.shippingState
                  ? `, ${order.customer.shippingState}`
                  : ""}{" "}
                {order.customer.shippingPostalCode}
                <br />
                {order.customer.shippingCountry}
              </address>
            </div>

            <Button variant="outline" size="sm" className="mt-6" asChild>
              <Link href={`/admin/customers/${order.customerId}`}>
                View client record
              </Link>
            </Button>
          </Card>

          {/* ── Samples ── */}
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">
              Samples & requested analyses
            </h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {requiredVials} vial{requiredVials === 1 ? "" : "s"} expected in
              total
            </p>
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
                          {sample.sampleCode} · batch {sample.batchNumber}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-sm font-semibold">
                        {formatCents(sample.lineTotalCents, order.currency)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                      <DataField label="Strength">
                        {sample.strength || "-"}
                      </DataField>
                      <DataField label="Vials submitted">
                        <span className="tabular">{sample.quantity}</span>
                      </DataField>
                      <DataField label="Expected peptide">
                        {sample.expectedPeptide || "-"}
                      </DataField>
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {tests.map((test) => (
                        <Badge
                          key={test.key}
                          variant={test.requiresExtraVial ? "primary" : "outline"}
                          title={
                            test.requiresExtraVial
                              ? "Requires a dedicated vial"
                              : undefined
                          }
                        >
                          {test.shortLabel}
                        </Badge>
                      ))}
                    </div>

                    {sample.notes ? (
                      <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Client note:{" "}
                        </span>
                        {sample.notes}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {order.specialInstructions ? (
              <div className="mt-6 rounded-2xl border border-lava-200 bg-lava-50/50 p-4 dark:border-lava-900/70 dark:bg-lava-950/25">
                <p className="overline mb-2">Client special instructions</p>
                <p className="text-[13px] leading-relaxed">
                  {order.specialInstructions}
                </p>
              </div>
            ) : null}

            {order.additionalCoaNames.length > 0 ? (
              <div className="mt-5 border-t border-border pt-5">
                <p className="overline mb-2.5">
                  Additional COA names requested
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.additionalCoaNames.map((name) => (
                    <Badge key={name} variant="muted">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          {/* ── Certificates ── */}
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Certificates
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/certificates/new?orderId=${order.id}`}>
                  <Plus aria-hidden />
                  Upload
                </Link>
              </Button>
            </div>
            <Separator className="my-5" />

            {order.certificates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No certificates uploaded for this order yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {order.certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <Link
                      href={`/admin/certificates/${certificate.id}`}
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
                      <div className="flex shrink-0 items-center gap-2">
                        <CertificateStatusBadge status={certificate.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
                    <span className="font-mono text-sm font-semibold">
                      {invoice.invoiceNumber}
                    </span>
                    <span className="tabular text-sm font-semibold">
                      {formatCents(invoice.totalCents, invoice.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-lava-500" aria-hidden />
              <h2 className="text-base font-semibold tracking-tight">
                Manage order
              </h2>
            </div>
            <Separator className="my-5" />
            <StatusControl
              orderId={order.id}
              currentStatus={order.status}
              adminNotes={order.adminNotes}
              hasInvoice={order.invoices.length > 0}
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Financials
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
                  <dt className="text-muted-foreground">
                    Discount ({order.discountPercent}%)
                  </dt>
                  <dd className="tabular text-[hsl(var(--pass))]">
                    −{formatCents(order.discountCents, order.currency)}
                  </dd>
                </div>
              ) : null}
              {order.expediteCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Expedite</dt>
                  <dd className="tabular">
                    +{formatCents(order.expediteCents, order.currency)}
                  </dd>
                </div>
              ) : null}
              {order.additionalCoaCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Extra COA names</dt>
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
              <Badge variant="muted">
                {order.paymentMethod.replace(/_/g, " ")}
              </Badge>
              <Badge
                variant={order.paymentStatus === "PAID" ? "pass" : "outline"}
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Status history
            </h2>
            <Separator className="my-5" />
            <OrderTimeline status={order.status} events={order.events} />
          </Card>
        </div>
      </div>
    </div>
  );
}
