import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FlaskConical,
  Inbox,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import { StatTile } from "@/components/shared/stat-tile";
import {
  CertificateStatusBadge,
  OrderStatusBadge,
} from "@/components/shared/status";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate, relativeTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [
    pendingOrders,
    inProgressOrders,
    privateCertificates,
    unreadMessages,
    customerCount,
    revenueThisPeriod,
    revenuePriorPeriod,
    outstandingInvoices,
    recentOrders,
    awaitingRelease,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: { in: ["SAMPLE_RECEIVED", "TESTING", "AWAITING_RESULTS"] } },
    }),
    prisma.certificate.count({ where: { status: "PRIVATE" } }),
    prisma.message.count({ where: { status: "UNREAD" } }),
    prisma.customer.count(),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
      _sum: { totalCents: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { totalCents: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.findMany({
      orderBy: { submittedAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        submittedAt: true,
        isExpedited: true,
        customer: { select: { companyName: true } },
        _count: { select: { samples: true } },
      },
    }),
    prisma.certificate.findMany({
      where: { status: "PRIVATE" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        certificateNumber: true,
        product: true,
        batchNumber: true,
        status: true,
        customerName: true,
        createdAt: true,
      },
    }),
  ]);

  const current = revenueThisPeriod._sum.totalCents ?? 0;
  const prior = revenuePriorPeriod._sum.totalCents ?? 0;
  // Only meaningful when there is a prior period to compare against.
  const delta =
    prior > 0 ? Math.round(((current - prior) / prior) * 100) : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        overline="Administration"
        title="Laboratory dashboard"
        description="Queue status, pending releases and recent activity."
        action={
          <Button asChild>
            <Link href="/admin/certificates/new">
              <ShieldCheck aria-hidden />
              Upload COA
            </Link>
          </Button>
        }
      />

      {/* ── Action-required banner ── */}
      {pendingOrders > 0 || privateCertificates > 0 || unreadMessages > 0 ? (
        <Card className="mt-8 border-lava-300 bg-lava-50/55 p-5 dark:border-lava-900 dark:bg-lava-950/25">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-lava-600 dark:text-lava-400"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold">Needs attention</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {[
                    pendingOrders > 0
                      ? `${pendingOrders} order${pendingOrders === 1 ? "" : "s"} awaiting acceptance`
                      : null,
                    privateCertificates > 0
                      ? `${privateCertificates} certificate${privateCertificates === 1 ? "" : "s"} awaiting release`
                      : null,
                    unreadMessages > 0
                      ? `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {pendingOrders > 0 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/orders?status=PENDING">Review orders</Link>
                </Button>
              ) : null}
              {privateCertificates > 0 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/certificates?status=PRIVATE">
                    Review COAs
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── Stats ── */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Awaiting acceptance"
          value={pendingOrders}
          icon={Inbox}
          tone={pendingOrders > 0 ? "pending" : "default"}
        />
        <StatTile
          label="In the laboratory"
          value={inProgressOrders}
          icon={FlaskConical}
          tone="primary"
          hint="Received, on instrument or in review"
        />
        <StatTile
          label="Paid, last 30 days"
          value={formatCents(current)}
          icon={Receipt}
          tone="pass"
          delta={delta}
        />
        <StatTile
          label="Outstanding"
          value={formatCents(outstandingInvoices._sum.totalCents ?? 0)}
          icon={Receipt}
          tone={outstandingInvoices._count > 0 ? "pending" : "default"}
          hint={`${outstandingInvoices._count} unpaid invoice${outstandingInvoices._count === 1 ? "" : "s"}`}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <StatTile label="Clients" value={customerCount} icon={Users} />
        <StatTile
          label="Awaiting release"
          value={privateCertificates}
          icon={ShieldCheck}
          tone={privateCertificates > 0 ? "pending" : "default"}
          hint="Private — not verifiable by anyone yet"
        />
        <StatTile
          label="Unread messages"
          value={unreadMessages}
          icon={MessageSquare}
          tone={unreadMessages > 0 ? "pending" : "default"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Recent orders ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent submissions
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                All orders
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              className="mt-6 border-0 bg-transparent py-10"
              icon={ClipboardList}
              title="No orders yet"
              description="Submissions will appear here as clients place them."
            />
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 py-4 transition-opacity hover:opacity-75"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-mono text-[13px] font-semibold">
                          {order.orderNumber}
                        </p>
                        {order.isExpedited ? (
                          <Badge variant="primary">Rush</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {order.customer.companyName} · {order._count.samples}{" "}
                        sample{order._count.samples === 1 ? "" : "s"} ·{" "}
                        {relativeTime(order.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
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

        {/* ── Awaiting release ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Awaiting release
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/certificates">
                Library
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          {awaitingRelease.length === 0 ? (
            <EmptyState
              className="mt-6 border-0 bg-transparent py-10"
              icon={ShieldCheck}
              title="Nothing pending"
              description="Every uploaded certificate has been released."
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {awaitingRelease.map((certificate) => (
                <li key={certificate.id}>
                  <Link
                    href={`/admin/certificates/${certificate.id}`}
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
                      <CertificateStatusBadge status={certificate.status} />
                    </div>
                    <p className="mt-3 truncate text-[11px] text-muted-foreground">
                      {certificate.customerName} · batch{" "}
                      {certificate.batchNumber} ·{" "}
                      {formatDate(certificate.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
