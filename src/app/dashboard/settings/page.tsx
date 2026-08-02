import type { Metadata } from "next";
import { Building2, KeyRound, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField, SectionHeading } from "@/components/shared/empty-state";
import { ProfileForm } from "@/app/dashboard/settings/profile-form";
import { PasswordForm } from "@/app/dashboard/settings/password-form";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Account Settings" };

export default async function CustomerSettingsPage() {
  const { customerId, session } = await requireCustomer("/dashboard/settings");

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      vatNumber: true,
      marketingOptIn: true,
      createdAt: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
      shippingCountry: true,
      billingLine1: true,
      billingCity: true,
      billingPostalCode: true,
      billingCountry: true,
      _count: { select: { orders: true, certificates: true } },
    },
  });

  if (!customer) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        overline="Client Portal"
        title="Account settings"
        description="Your contact details, addresses and password."
      />

      <div className="mt-9 space-y-6">
        {/* ── Account summary ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <Building2 className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Account
            </h2>
          </div>
          <Separator className="my-5" />

          <dl className="grid gap-6 sm:grid-cols-2">
            <DataField label="Signed in as">{session.user.email}</DataField>
            <DataField label="Client since">
              {formatDate(customer.createdAt)}
            </DataField>
            <DataField label="Orders placed">
              <span className="tabular">{customer._count.orders}</span>
            </DataField>
            <DataField label="Certificates issued">
              <span className="tabular">{customer._count.certificates}</span>
            </DataField>
          </dl>

          <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Your email address is the identity on your certificates and cannot
                be changed here. Contact the laboratory if it needs updating, so we
                can keep your certificate history intact.
              </span>
            </p>
          </div>
        </Card>

        {/* ── Profile ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <MapPin className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Contact & Addresses
            </h2>
          </div>
          <Separator className="my-5" />

          <div className="mb-6 rounded-2xl border border-lava-200 bg-lava-50/50 p-4 dark:border-lava-900/70 dark:bg-lava-950/25">
            <p className="text-[13px] leading-relaxed">
              <strong className="font-semibold">
                The company name below appears on your certificates
              </strong>{" "}
              exactly as entered, for all future orders. Certificates already
              issued are not changed.
            </p>
          </div>

          <ProfileForm
            defaults={{
              companyName: customer.companyName,
              contactPerson: customer.contactPerson,
              phone: customer.phone,
              vatNumber: customer.vatNumber ?? "",
              marketingOptIn: customer.marketingOptIn,
              shipping: {
                line1: customer.shippingLine1 ?? "",
                line2: customer.shippingLine2 ?? "",
                city: customer.shippingCity ?? "",
                state: customer.shippingState ?? "",
                postalCode: customer.shippingPostalCode ?? "",
                country: customer.shippingCountry ?? "",
              },
            }}
          />
        </Card>

        {/* ── Password ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <KeyRound className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Password
            </h2>
          </div>
          <Separator className="my-5" />
          <PasswordForm />
        </Card>

        {/* ── Data rights ── */}
        <Card className="bg-muted/40 p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            Your data
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            You can request access to, correction of, or deletion of your personal
            information at any time. Note that an issued analytical record cannot
            be deleted within its seven-year retention period — doing so would
            break the certificate register that third parties rely on when
            verifying your documents.
          </p>
          <div className="mt-4">
            <Badge variant="muted">Research use only</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
