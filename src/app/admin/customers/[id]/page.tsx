import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import { StatTile } from "@/components/shared/stat-tile";
import {
  CertificateStatusBadge,
  OrderStatusBadge,
} from "@/components/shared/status";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [customer, revenue] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, lastLoginAt: true, isActive: true } },
        orders: {
          orderBy: { submittedAt: "desc" },
          take: 15,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalCents: true,
            currency: true,
            submittedAt: true,
            _count: { select: { samples: true } },
          },
        },
        certificates: {
          orderBy: { issuedDate: "desc" },
          take: 15,
          select: {
            id: true,
            certificateNumber: true,
            product: true,
            batchNumber: true,
            status: true,
            issuedDate: true,
          },
        },
        _count: {
          select: { orders: true, certificates: true, invoices: true },
        },
      },
    }),
    prisma.invoice.aggregate({
      where: { customerId: id, status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All customers
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {customer.companyName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Client since {formatDate(customer.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {customer.user ? (
            <Badge variant={customer.user.isActive ? "pass" : "muted"}>
              {customer.user.isActive ? "Portal active" : "Portal disabled"}
            </Badge>
          ) : (
            <Badge variant="muted">No portal account</Badge>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Orders"
          value={customer._count.orders}
          icon={Package}
        />
        <StatTile
          label="Certificates"
          value={customer._count.certificates}
          icon={ShieldCheck}
          tone="primary"
        />
        <StatTile
          label="Invoices"
          value={customer._count.invoices}
          icon={Receipt}
        />
        <StatTile
          label="Paid to date"
          value={formatCents(revenue._sum.totalCents ?? 0)}
          icon={Receipt}
          tone="pass"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* ── Orders ── */}
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Recent orders
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/orders?q=${encodeURIComponent(customer.email)}`}>
                  All orders
                </Link>
              </Button>
            </div>
            <Separator className="my-5" />

            {customer.orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {customer.orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-opacity hover:opacity-75"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[13px] font-semibold">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {order._count.samples} sample
                          {order._count.samples === 1 ? "" : "s"} ·{" "}
                          {formatDate(order.submittedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="tabular hidden text-sm font-semibold sm:block">
                          {formatCents(order.totalCents, order.currency)}
                        </span>
                        <OrderStatusBadge
                          status={order.status}
                          showIcon={false}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ── Certificates ── */}
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Certificates
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/certificates?customerId=${customer.id}`}>
                  All certificates
                </Link>
              </Button>
            </div>
            <Separator className="my-5" />

            {customer.certificates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No certificates issued yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {customer.certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <Link
                      href={`/admin/certificates/${certificate.id}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-opacity hover:opacity-75"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {certificate.product}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                          {certificate.certificateNumber} · batch{" "}
                          {certificate.batchNumber}
                        </p>
                      </div>
                      <CertificateStatusBadge status={certificate.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Contact details
            </h2>
            <Separator className="my-5" />

            <dl className="space-y-5">
              <DataField label="Contact person">
                {customer.contactPerson}
              </DataField>
              <DataField label="Email">
                <a
                  href={`mailto:${customer.email}`}
                  className="inline-flex items-center gap-1.5 break-all hover:text-lava-600 dark:hover:text-lava-400"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  {customer.email}
                </a>
              </DataField>
              <DataField label="Phone">
                <a
                  href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 hover:text-lava-600 dark:hover:text-lava-400"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {customer.phone}
                </a>
              </DataField>
              {customer.vatNumber ? (
                <DataField label="VAT number" mono>
                  {customer.vatNumber}
                </DataField>
              ) : null}
              <DataField label="Marketing opt-in">
                {customer.marketingOptIn ? "Yes" : "No"}
              </DataField>
              {customer.user?.lastLoginAt ? (
                <DataField label="Last portal sign-in">
                  {formatDate(customer.user.lastLoginAt)}
                </DataField>
              ) : null}
            </dl>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <MapPin className="size-4 text-lava-500" aria-hidden />
              <h2 className="text-base font-semibold tracking-tight">
                Addresses
              </h2>
            </div>
            <Separator className="my-5" />

            <div>
              <p className="overline mb-2">Shipping</p>
              <address className="text-[13px] not-italic leading-relaxed text-muted-foreground">
                {customer.shippingLine1 ?? "-"}
                {customer.shippingLine2 ? (
                  <>
                    <br />
                    {customer.shippingLine2}
                  </>
                ) : null}
                {customer.shippingCity ? (
                  <>
                    <br />
                    {customer.shippingCity}
                    {customer.shippingState ? `, ${customer.shippingState}` : ""}{" "}
                    {customer.shippingPostalCode}
                  </>
                ) : null}
                {customer.shippingCountry ? (
                  <>
                    <br />
                    {customer.shippingCountry}
                  </>
                ) : null}
              </address>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="overline mb-2">Billing</p>
              <address className="text-[13px] not-italic leading-relaxed text-muted-foreground">
                {customer.billingLine1 ?? "-"}
                {customer.billingCity ? (
                  <>
                    <br />
                    {customer.billingCity} {customer.billingPostalCode}
                  </>
                ) : null}
                {customer.billingCountry ? (
                  <>
                    <br />
                    {customer.billingCountry}
                  </>
                ) : null}
              </address>
            </div>
          </Card>

          {customer.internalNotes ? (
            <Card className="bg-muted/45 p-6">
              <p className="overline mb-2.5">Internal notes</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {customer.internalNotes}
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
