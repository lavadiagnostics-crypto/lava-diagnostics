import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Copy,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import { Reveal, SuccessCheck } from "@/components/shared/motion";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Submission Confirmed",
  robots: { index: false, follow: false },
};

/**
 * Order confirmation.
 *
 * Looks the order up by number to render real details rather than trusting query
 * parameters. Only non-sensitive fields are shown, and no authentication is
 * required - the order number acts as the reference the submitter just received,
 * and nothing here is more revealing than the confirmation email they were sent.
 */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber) redirect("/submit");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      totalCents: true,
      currency: true,
      isExpedited: true,
      submittedAt: true,
      customer: {
        select: { companyName: true, contactPerson: true, email: true },
      },
      samples: {
        select: {
          sampleCode: true,
          productName: true,
          batchNumber: true,
          quantity: true,
          testSterility: true,
          testEndotoxin: true,
        },
      },
    },
  });

  if (!order) redirect("/submit");

  // Vial count, recomputed for the shipping instructions.
  const requiredVials = order.samples.reduce(
    (sum, sample) =>
      sum +
      sample.quantity +
      (sample.testSterility ? 1 : 0) +
      (sample.testEndotoxin ? 1 : 0),
    0,
  );

  return (
    <div className="container py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <SuccessCheck />
          <Badge variant="pass" size="lg" className="mt-7">
            Submission received
          </Badge>
          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tightest sm:text-4xl">
            Your order is logged
          </h1>
          <p className="mt-4 max-w-lg text-balance text-[17px] leading-relaxed text-muted-foreground">
            We have reserved capacity on the analytical schedule and sent a
            confirmation to {order.customer.email}.
          </p>
        </div>

        {/* ── Order number ── */}
        <Card className="mt-10 border-2 border-lava-500 p-7 text-center">
          <p className="overline mb-3">Your order number</p>
          <p className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
            {order.orderNumber}
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
            <Copy className="size-3.5" aria-hidden />
            Write this number on a slip inside your package
          </p>
        </Card>

        {/* ── Next steps ── */}
        <Card className="mt-6 p-7 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">
            What happens next
          </h2>
          <Separator className="my-6" />

          <ol className="space-y-6">
            {[
              {
                icon: Package,
                title: `Ship ${requiredVials} vial${requiredVials === 1 ? "" : "s"} to the laboratory`,
                body: "Crimped and unopened, in rigid secondary packaging with absorbent material. Include your order number inside the package.",
              },
              {
                icon: Mail,
                title: "We confirm receipt",
                body: "Every vial is photographed and inspected on arrival. You will be emailed the moment your samples are logged in.",
              },
              {
                icon: LayoutDashboard,
                title: "Track progress in your portal",
                body: "Follow your order through acceptance, testing and review, and download your certificate the moment it is released.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lava-50 text-lava-600 dark:bg-lava-950/45 dark:text-lava-400">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold tracking-tight">
                      {index + 1}. {item.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* ── Shipping address ── */}
        <Card className="mt-6 p-7 sm:p-8">
          <div className="flex items-center gap-2.5">
            <MapPin className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Ship samples to
            </h2>
          </div>
          <Separator className="my-6" />

          <address className="text-[15px] font-medium not-italic leading-relaxed">
            {BRAND.name} - Sample Receiving
            <br />
            {BRAND.address.line1}
            <br />
            {BRAND.address.line2}
            <br />
            {BRAND.address.city}, {BRAND.address.state}{" "}
            {BRAND.address.postalCode}
            <br />
            {BRAND.address.country}
          </address>

          <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
            Declare contents as research chemical samples for laboratory analysis.
            Do not describe them as pharmaceuticals or supplements - an inaccurate
            declaration is the most common cause of a customs hold.
          </p>
        </Card>

        {/* ── Order summary ── */}
        <Card className="mt-6 p-7 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">
            Order summary
          </h2>
          <Separator className="my-6" />

          <dl className="grid gap-6 sm:grid-cols-2">
            <DataField label="Issued to">{order.customer.companyName}</DataField>
            <DataField label="Sample lines">
              <span className="tabular">{order.samples.length}</span>
            </DataField>
            <DataField label="Vials to ship">
              <span className="tabular">{requiredVials}</span>
            </DataField>
            <DataField label="Estimated total">
              <span className="tabular">
                {formatCents(order.totalCents, order.currency)}
              </span>
            </DataField>
          </dl>

          {order.isExpedited ? (
            <div className="mt-6">
              <Badge variant="primary">Expedited processing requested</Badge>
            </div>
          ) : null}

          <ul className="mt-7 space-y-3 border-t border-border pt-6">
            {order.samples.map((sample) => (
              <li
                key={sample.sampleCode}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">{sample.productName}</span>
                  <span className="ml-2 font-mono text-[13px] text-muted-foreground">
                    batch {sample.batchNumber}
                  </span>
                </span>
                <span className="tabular shrink-0 text-[13px] text-muted-foreground">
                  {sample.quantity} vial{sample.quantity === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
            The total above is an estimate. It is confirmed at invoicing, where
            volume tiers are applied against your total monthly volume - so your
            invoice may be lower than this figure, never higher.
          </p>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/orders">
              <LayoutDashboard aria-hidden />
              Track this order
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full sm:w-auto"
          >
            <Link href="/submit">
              Submit another order
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
