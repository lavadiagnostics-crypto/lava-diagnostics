import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Zap } from "lucide-react";
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
  ORDER_STATUS_META,
  OrderStatusBadge,
} from "@/components/shared/status";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrderStatus, Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Orders" };

const STATUS_FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "SAMPLE_RECEIVED",
  "TESTING",
  "AWAITING_RESULTS",
  "COMPLETED",
  "SHIPPED",
  "REJECTED",
];

const PAGE_SIZE = 30;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;

  // Only accept a status we actually recognise — an arbitrary value would
  // otherwise reach Prisma as an invalid enum.
  const status =
    params.status && STATUS_FILTERS.includes(params.status as OrderStatus)
      ? (params.status as OrderStatus | "ALL")
      : "ALL";

  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            {
              customer: {
                companyName: { contains: query, mode: "insensitive" },
              },
            },
            { customer: { email: { contains: query, mode: "insensitive" } } },
            {
              samples: {
                some: {
                  OR: [
                    { productName: { contains: query, mode: "insensitive" } },
                    { batchNumber: { contains: query, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        submittedAt: true,
        isExpedited: true,
        customer: { select: { companyName: true, email: true } },
        _count: { select: { samples: true, certificates: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** Preserves the current filters when building a link. */
  function href(next: Record<string, string | undefined>): string {
    const search = new URLSearchParams();
    const merged = { status, q: query || undefined, page: String(page), ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "ALL" && !(key === "page" && value === "1")) {
        search.set(key, value);
      }
    }
    const qs = search.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        overline="Administration"
        title="Orders"
        description="Accept, track and progress client submissions."
      />

      {/* ── Filters ── */}
      <div className="mt-8 space-y-4">
        <form action="/admin/orders" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search order number, client, product or batch…"
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-lava-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lava-500/20"
            aria-label="Search orders"
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
                {filter === "ALL" ? "All" : ORDER_STATUS_META[filter].label}
                <span className="tabular opacity-60">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={ClipboardList}
          title={query || status !== "ALL" ? "No matching orders" : "No orders yet"}
          description={
            query || status !== "ALL"
              ? "Try a different search term or clear the status filter."
              : "Client submissions will appear here as they arrive."
          }
          action={
            query || status !== "ALL" ? (
              <Button variant="outline" asChild>
                <Link href="/admin/orders">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card className="mt-8 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/45 hover:bg-muted/45">
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-center">Samples</TableHead>
                  <TableHead className="text-center">COAs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="group inline-flex items-center gap-2"
                      >
                        <span className="font-mono text-[13px] font-semibold group-hover:text-lava-600 dark:group-hover:text-lava-400">
                          {order.orderNumber}
                        </span>
                        {order.isExpedited ? (
                          <Badge variant="primary" title="Expedited">
                            <Zap aria-hidden />
                          </Badge>
                        ) : null}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate text-sm font-medium">
                        {order.customer.companyName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.customer.email}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                      {formatDate(order.submittedAt)}
                    </TableCell>
                    <TableCell className="tabular text-center text-sm">
                      {order._count.samples}
                    </TableCell>
                    <TableCell className="tabular text-center text-sm">
                      {order._count.certificates || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} showIcon={false} />
                    </TableCell>
                    <TableCell className="tabular pr-6 text-right text-sm font-semibold">
                      {formatCents(order.totalCents, order.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-[13px] text-muted-foreground">
                Page {page} of {totalPages} · {total} order
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
