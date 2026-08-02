import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus, Zap } from "lucide-react";
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
import { OrderStatusBadge } from "@/components/shared/status";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function CustomerOrdersPage() {
  const { customerId } = await requireCustomer("/dashboard/orders");

  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      submittedAt: true,
      isExpedited: true,
      _count: { select: { samples: true, certificates: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        overline="Client Portal"
        title="Orders"
        description="Every submission you have made, with live status."
        action={
          <Button asChild>
            <Link href="/submit">
              <Plus aria-hidden />
              New submission
            </Link>
          </Button>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={ClipboardList}
          title="No orders yet"
          description="Once you submit samples, your orders will appear here and you can follow them from receipt through to certificate release."
          action={
            <Button asChild>
              <Link href="/submit">Submit your first samples</Link>
            </Button>
          }
        />
      ) : (
        <Card className="mt-9 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-center">Samples</TableHead>
                <TableHead className="text-center">Certificates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Estimate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell className="pl-6">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="group inline-flex items-center gap-2"
                    >
                      <span className="font-mono text-sm font-semibold group-hover:text-lava-600 dark:group-hover:text-lava-400">
                        {order.orderNumber}
                      </span>
                      {order.isExpedited ? (
                        <Badge variant="primary" title="Expedited processing">
                          <Zap aria-hidden />
                        </Badge>
                      ) : null}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(order.submittedAt)}
                  </TableCell>
                  <TableCell className="tabular text-center text-sm">
                    {order._count.samples}
                  </TableCell>
                  <TableCell className="tabular text-center text-sm">
                    {order._count.certificates > 0 ? (
                      order._count.certificates
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} showIcon={false} />
                  </TableCell>
                  <TableCell className="tabular pr-6 text-right font-semibold">
                    {formatCents(order.totalCents, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
