import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
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
import { StatTile } from "@/components/shared/stat-tile";
import { InvoiceStatusControl } from "@/app/admin/invoices/invoice-status-control";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoices" };

export default async function AdminInvoicesPage() {
  await requireAdmin();

  const [invoices, outstanding, paid, overdue] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issuedDate: "desc" },
      take: 100,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        issuedDate: true,
        dueDate: true,
        paidAt: true,
        customer: { select: { id: true, companyName: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { totalCents: true },
    }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        overline="Administration"
        title="Invoices"
        description="Billing across all clients. Invoices are generated from an order's line items."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <StatTile
          label="Outstanding"
          value={formatCents(outstanding._sum.totalCents ?? 0)}
          icon={Receipt}
          tone={outstanding._count > 0 ? "pending" : "default"}
          hint={`${outstanding._count} unpaid`}
        />
        <StatTile
          label="Collected"
          value={formatCents(paid._sum.totalCents ?? 0)}
          icon={Receipt}
          tone="pass"
        />
        <StatTile
          label="Overdue"
          value={overdue}
          icon={Receipt}
          tone={overdue > 0 ? "fail" : "default"}
        />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Receipt}
          title="No invoices yet"
          description="Generate an invoice from an order's detail page once analysis is complete."
        />
      ) : (
        <Card className="mt-8 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                <TableHead className="pl-6">Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="pl-6 font-mono text-[13px] font-semibold">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <Link
                      href={`/admin/customers/${invoice.customer.id}`}
                      className="block truncate text-sm hover:text-lava-600 dark:hover:text-lava-400"
                    >
                      {invoice.customer.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {invoice.order ? (
                      <Link
                        href={`/admin/orders/${invoice.order.id}`}
                        className="font-mono text-[13px] text-muted-foreground hover:text-lava-600 dark:hover:text-lava-400"
                      >
                        {invoice.order.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground"> - </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                    {formatDate(invoice.issuedDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                    {invoice.paidAt
                      ? `Paid ${formatDate(invoice.paidAt)}`
                      : formatDate(invoice.dueDate)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusControl
                      invoiceId={invoice.id}
                      status={invoice.status}
                    />
                  </TableCell>
                  <TableCell className="tabular pr-6 text-right text-sm font-semibold">
                    {formatCents(invoice.totalCents, invoice.currency)}
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
