import type { Metadata } from "next";
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
import { InvoiceStatusBadge } from "@/components/shared/status";
import { StatTile } from "@/components/shared/stat-tile";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoices" };

/** Line item shape frozen into `Invoice.lineItems` at creation. */
interface InvoiceLineItem {
  description: string;
  amountCents: number;
}

function parseLineItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "description" in item &&
      "amountCents" in item
    ) {
      return [
        {
          description: String((item as InvoiceLineItem).description),
          amountCents: Number((item as InvoiceLineItem).amountCents) || 0,
        },
      ];
    }
    return [];
  });
}

export default async function CustomerInvoicesPage() {
  const { customerId } = await requireCustomer("/dashboard/invoices");

  const [invoices, outstanding, paid] = await Promise.all([
    prisma.invoice.findMany({
      where: { customerId, status: { not: "DRAFT" } },
      orderBy: { issuedDate: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        issuedDate: true,
        dueDate: true,
        paidAt: true,
        lineItems: true,
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.invoice.aggregate({
      where: { customerId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { customerId, status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        overline="Client Portal"
        title="Invoices"
        description="Billing history for your analytical work."
      />

      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        <StatTile
          label="Outstanding"
          value={formatCents(outstanding._sum.totalCents ?? 0)}
          icon={Receipt}
          tone={outstanding._count > 0 ? "pending" : "default"}
          hint={`${outstanding._count} invoice${outstanding._count === 1 ? "" : "s"} awaiting payment`}
        />
        <StatTile
          label="Paid to date"
          value={formatCents(paid._sum.totalCents ?? 0)}
          icon={Receipt}
          tone="pass"
        />
        <StatTile
          label="Total invoices"
          value={invoices.length}
          icon={Receipt}
        />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Receipt}
          title="No invoices yet"
          description="We invoice once your analysis is complete and your certificate has been released. Results are never held pending payment."
        />
      ) : (
        <Card className="mt-8 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                <TableHead className="pl-6">Invoice</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const items = parseLineItems(invoice.lineItems);

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="pl-6">
                      <p className="font-mono text-sm font-semibold">
                        {invoice.invoiceNumber}
                      </p>
                      {items.length > 0 ? (
                        <p className="mt-1 max-w-[24ch] truncate text-xs text-muted-foreground">
                          {items.length} line item
                          {items.length === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-[13px] text-muted-foreground">
                      {invoice.order?.orderNumber ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(invoice.issuedDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {invoice.paidAt
                        ? `Paid ${formatDate(invoice.paidAt)}`
                        : formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="tabular pr-6 text-right font-semibold">
                      {formatCents(invoice.totalCents, invoice.currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        Questions about an invoice? Reply to the invoice email or contact the
        laboratory directly — billing queries are handled by a person, not a
        portal ticket.
      </p>
    </div>
  );
}
