import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FlaskConical,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import { OrderStatusBadge, ResultBadge } from "@/components/shared/status";
import { StatTile } from "@/components/shared/stat-tile";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate, relativeTime } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const { customerId, companyName } = await requireCustomer("/dashboard");

  // Every query below is scoped by customerId - the tenancy boundary.
  const [
    activeOrders,
    completedOrders,
    certificateCount,
    outstandingInvoices,
    recentOrders,
    recentCertificates,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        customerId,
        status: {
          in: ["PENDING", "ACCEPTED", "SAMPLE_RECEIVED", "TESTING", "AWAITING_RESULTS"],
        },
      },
    }),
    prisma.order.count({
      where: { customerId, status: { in: ["COMPLETED", "SHIPPED"] } },
    }),
    prisma.certificate.count({
      where: { customerId, status: { in: ["VERIFIED", "PRIVATE"] } },
    }),
    prisma.invoice.aggregate({
      where: { customerId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        submittedAt: true,
        _count: { select: { samples: true } },
      },
    }),
    prisma.certificate.findMany({
      where: { customerId, status: "VERIFIED" },
      orderBy: { issuedDate: "desc" },
      take: 4,
      select: {
        id: true,
        certificateNumber: true,
        verificationToken: true,
        product: true,
        batchNumber: true,
        result: true,
        issuedDate: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        overline="Client Portal"
        title={`Welcome back, ${companyName}`}
        description="Track submissions, download certificates and manage your account."
        action={
          <Button asChild>
            <Link href="/submit">
              <Plus aria-hidden />
              New submission
            </Link>
          </Button>
        }
      />

      {/* ── Stats ── */}
      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active orders"
          value={activeOrders}
          icon={FlaskConical}
          tone="primary"
          hint="In the queue or on instrument"
        />
        <StatTile
          label="Completed orders"
          value={completedOrders}
          icon={Package}
          tone="pass"
        />
        <StatTile
          label="Certificates issued"
          value={certificateCount}
          icon={ShieldCheck}
        />
        <StatTile
          label="Outstanding"
          value={formatCents(outstandingInvoices._sum.totalCents ?? 0)}
          icon={Receipt}
          tone={outstandingInvoices._count > 0 ? "pending" : "default"}
          hint={
            outstandingInvoices._count > 0
              ? `${outstandingInvoices._count} invoice${outstandingInvoices._count === 1 ? "" : "s"} awaiting payment`
              : "Nothing outstanding"
          }
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Recent orders ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent orders
            </h2>
            {recentOrders.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/orders">
                  View all
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              className="mt-6 border-0 bg-transparent py-10"
              icon={ClipboardList}
              title="No orders yet"
              description="Your submissions will appear here with live status as they move through the laboratory."
              action={
                <Button asChild>
                  <Link href="/submit">Submit your first samples</Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="group flex items-center justify-between gap-4 py-4 transition-opacity hover:opacity-75"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {order._count.samples} sample
                        {order._count.samples === 1 ? "" : "s"} ·{" "}
                        {relativeTime(order.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="tabular hidden text-sm font-semibold sm:block">
                        {formatCents(order.totalCents, order.currency)}
                      </span>
                      <OrderStatusBadge status={order.status} showIcon={false} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── Recent certificates ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Latest certificates
            </h2>
            {recentCertificates.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/certificates">
                  View all
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>

          {recentCertificates.length === 0 ? (
            <EmptyState
              className="mt-6 border-0 bg-transparent py-10"
              icon={ShieldCheck}
              title="No certificates yet"
              description="Certificates appear here as soon as they are reviewed, signed and released."
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {recentCertificates.map((certificate) => (
                <li key={certificate.id}>
                  <Link
                    href={`/verify/${certificate.verificationToken}`}
                    className="block rounded-2xl border border-border p-4 transition-colors hover:border-lava-200 hover:bg-muted/45 dark:hover:border-lava-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {certificate.product}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                          {certificate.certificateNumber}
                        </p>
                      </div>
                      <ResultBadge result={certificate.result} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                      <span className="truncate">
                        Batch {certificate.batchNumber}
                      </span>
                      <span className="shrink-0">
                        {formatDate(certificate.issuedDate)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Verification reminder ── */}
      <Card className="mt-6 border-lava-200 bg-lava-50/50 p-6 sm:p-7 dark:border-lava-900/70 dark:bg-lava-950/25">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-lava-600 shadow-subtle dark:bg-charcoal-900 dark:text-lava-400">
              <ShieldCheck className="size-4" aria-hidden />
            </span>
            <div className="max-w-xl">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Your customers can verify your certificates themselves
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Share the certificate number or QR code and anyone can confirm it
                is genuine - without needing an account, and without being able to
                see any of your other certificates.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/verify">Try verification</Link>
          </Button>
        </div>
      </Card>

      {/* Small print about the estimate/invoice distinction. */}
      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        Order totals shown are estimates until invoiced.{" "}
        <Badge variant="muted" className="align-middle">
          Research use only
        </Badge>
      </p>
    </div>
  );
}
