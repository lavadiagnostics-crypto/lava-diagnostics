import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
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
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const where: Prisma.CustomerWhereInput = query
    ? {
        OR: [
          { companyName: { contains: query, mode: "insensitive" } },
          { contactPerson: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      createdAt: true,
      userId: true,
      shippingCountry: true,
      _count: { select: { orders: true, certificates: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        overline="Administration"
        title="Customers"
        description="Client records, order history and portal access."
      />

      <form action="/admin/customers" className="mt-8 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search company, contact, email or phone…"
          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-[15px] placeholder:text-muted-foreground/70 focus-visible:border-lava-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lava-500/20"
          aria-label="Search customers"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Users}
          title={query ? "No matching customers" : "No customers yet"}
          description={
            query
              ? "Try a different search term."
              : "Client records are created automatically when a submission is received."
          }
          action={
            query ? (
              <Button variant="outline" asChild>
                <Link href="/admin/customers">Clear search</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="mt-8 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45 hover:bg-muted/45">
                <TableHead className="pl-6">Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">COAs</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead className="pr-6 text-right">Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="max-w-[240px] pl-6">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="group block"
                    >
                      <p className="truncate text-sm font-semibold group-hover:text-lava-600 dark:group-hover:text-lava-400">
                        {customer.companyName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[160px]">
                    <p className="truncate text-sm">{customer.contactPerson}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {customer.phone}
                    </p>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {customer.shippingCountry ?? "—"}
                  </TableCell>
                  <TableCell className="tabular text-center text-sm">
                    {customer._count.orders}
                  </TableCell>
                  <TableCell className="tabular text-center text-sm">
                    {customer._count.certificates}
                  </TableCell>
                  <TableCell>
                    {customer.userId ? (
                      <Badge variant="pass">Active</Badge>
                    ) : (
                      <Badge variant="muted">No account</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap pr-6 text-right text-[13px] text-muted-foreground">
                    {formatDate(customer.createdAt)}
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
