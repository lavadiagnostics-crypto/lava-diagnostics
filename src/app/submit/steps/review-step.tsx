"use client";

import { useFormContext } from "react-hook-form";
import {
  Building2,
  CreditCard,
  Landmark,
  MapPin,
  Receipt,
  ShieldCheck,
  TestTube,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
  Separator,
} from "@/components/ui/misc";
import { DataField } from "@/components/shared/empty-state";
import { cn, formatCents } from "@/lib/utils";
import { TEST_CATALOG, type TestKey } from "@/lib/pricing";
import type { SubmissionFormValues } from "@/app/submit/submission-form";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-2 text-[13px] text-destructive" role="alert">
      {message}
    </p>
  );
}

const PAYMENT_OPTIONS = [
  {
    value: "INVOICE" as const,
    icon: Receipt,
    title: "Invoice on completion",
    description:
      "We invoice when your certificate is released, payable within fourteen days. Results are never held pending payment.",
    recommended: true,
  },
  {
    value: "BANK_TRANSFER" as const,
    icon: Landmark,
    title: "Bank transfer",
    description:
      "We send transfer details with your invoice. Suitable for international clients and purchase-order workflows.",
    recommended: false,
  },
  {
    value: "CARD" as const,
    icon: CreditCard,
    title: "Card payment",
    description:
      "A secure payment link is emailed with your invoice. We never handle or store card details ourselves.",
    recommended: false,
  },
];

export function ReviewStep({ onEditStep }: { onEditStep: (step: number) => void }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SubmissionFormValues>();

  const values = watch();
  const paymentMethod = values.paymentMethod;

  const billing = values.billingSameAsShipping ? values.shipping : values.billing;

  return (
    <div className="space-y-6">
      {/* ── Contact review ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Contact & Addresses
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
          >
            Edit
          </Button>
        </div>
        <Separator className="my-6" />

        <dl className="grid gap-6 sm:grid-cols-2">
          <DataField label="Certificate will be issued to">
            <span className="font-semibold">{values.companyName}</span>
          </DataField>
          <DataField label="Contact person">{values.contactPerson}</DataField>
          <DataField label="Email">{values.email}</DataField>
          <DataField label="Phone">{values.phone}</DataField>
        </dl>

        <div className="mt-7 grid gap-7 border-t border-border pt-7 sm:grid-cols-2">
          <div>
            <p className="overline mb-2.5 flex items-center gap-1.5">
              <MapPin className="size-3" aria-hidden />
              Shipping from
            </p>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              {values.shipping?.line1}
              {values.shipping?.line2 ? (
                <>
                  <br />
                  {values.shipping.line2}
                </>
              ) : null}
              <br />
              {values.shipping?.city}
              {values.shipping?.state ? `, ${values.shipping.state}` : ""}{" "}
              {values.shipping?.postalCode}
              <br />
              {values.shipping?.country}
            </address>
          </div>

          <div>
            <p className="overline mb-2.5 flex items-center gap-1.5">
              <Receipt className="size-3" aria-hidden />
              Billing
              {values.billingSameAsShipping ? (
                <span className="font-normal normal-case tracking-normal text-muted-foreground">
                  (same as shipping)
                </span>
              ) : null}
            </p>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              {billing?.line1}
              {billing?.line2 ? (
                <>
                  <br />
                  {billing.line2}
                </>
              ) : null}
              <br />
              {billing?.city}
              {billing?.state ? `, ${billing.state}` : ""} {billing?.postalCode}
              <br />
              {billing?.country}
            </address>
          </div>
        </div>
      </Card>

      {/* ── Samples review ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <TestTube className="size-4 text-lava-500" aria-hidden />
            <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
              Samples & Analyses
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
          >
            Edit
          </Button>
        </div>
        <Separator className="my-6" />

        <ul className="space-y-5">
          {(values.samples ?? []).map((sample, index) => {
            const selected = TEST_CATALOG.filter(
              (t) => (sample.tests as Record<TestKey, boolean>)?.[t.key],
            );

            return (
              <li
                key={index}
                className="rounded-2xl border border-border bg-muted/35 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold tracking-tight">
                      {index + 1}. {sample.productName || "Unnamed sample"}
                    </p>
                    <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                      Batch {sample.batchNumber || "-"}
                      {sample.strength ? ` · ${sample.strength}` : ""}
                      {" · "}
                      {sample.quantity} vial{sample.quantity === 1 ? "" : "s"}
                    </p>
                    {sample.expectedPeptide ? (
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Expected: {sample.expectedPeptide}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.map((test) => (
                    <Badge key={test.key} variant="outline">
                      {test.shortLabel}
                      {test.priceCents > 0 ? (
                        <span className="tabular ml-1 opacity-65">
                          {formatCents(
                            test.perVial
                              ? test.priceCents * (sample.quantity || 1)
                              : test.priceCents,
                          )}
                        </span>
                      ) : null}
                    </Badge>
                  ))}
                </div>

                {sample.notes ? (
                  <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>
                    {sample.notes}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {values.isExpedited ||
        (values.additionalCoaNames ?? []).filter((n) => n.trim()).length > 0 ||
        values.specialInstructions ? (
          <dl className="mt-7 space-y-4 border-t border-border pt-7">
            {values.isExpedited ? (
              <div className="flex items-center gap-2.5">
                <Badge variant="primary">Expedited</Badge>
                <span className="text-[13px] text-muted-foreground">
                  Moved to the front of the queue, +20% surcharge
                </span>
              </div>
            ) : null}

            {(values.additionalCoaNames ?? []).filter((n) => n.trim()).length >
            0 ? (
              <DataField label="Additional COA names">
                {(values.additionalCoaNames ?? [])
                  .filter((n) => n.trim())
                  .join(" · ")}
              </DataField>
            ) : null}

            {values.specialInstructions ? (
              <DataField label="Special instructions">
                <span className="text-[15px] font-normal leading-relaxed text-muted-foreground">
                  {values.specialInstructions}
                </span>
              </DataField>
            ) : null}
          </dl>
        ) : null}
      </Card>

      {/* ── Payment ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5">
          <CreditCard className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Payment Method
          </h2>
        </div>
        <Separator className="my-6" />

        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) =>
            setValue("paymentMethod", value as SubmissionFormValues["paymentMethod"], {
              shouldValidate: true,
            })
          }
        >
          {PAYMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = paymentMethod === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-colors",
                  selected
                    ? "border-lava-400 bg-lava-50/70 dark:border-lava-800 dark:bg-lava-950/30"
                    : "border-border hover:bg-muted/45",
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`payment-${option.value}`}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Icon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="text-sm font-semibold">{option.title}</span>
                    {option.recommended ? (
                      <Badge variant="muted">Recommended</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </RadioGroup>

        <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
          No payment is taken now. Your estimate is confirmed at invoicing, after
          your samples have been received and analysed.
        </p>
      </Card>

      {/* ── Declarations ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Declarations
          </h2>
        </div>
        <Separator className="my-6" />

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3.5">
            <Checkbox
              checked={values.confirmVialCondition === true}
              onCheckedChange={(checked) =>
                setValue(
                  "confirmVialCondition",
                  (checked === true) as true,
                  { shouldValidate: true },
                )
              }
              className="mt-0.5"
            />
            <span className="text-[13px] leading-relaxed">
              I confirm my samples will be shipped in{" "}
              <strong className="font-semibold">crimped, unopened vials</strong>,
              and that I have included the required number of vials shown in the
              order summary.
            </span>
          </label>
          <FieldError message={errors.confirmVialCondition?.message} />

          <label className="flex cursor-pointer items-start gap-3.5">
            <Checkbox
              checked={values.acceptTerms === true}
              onCheckedChange={(checked) =>
                setValue("acceptTerms", (checked === true) as true, {
                  shouldValidate: true,
                })
              }
              className="mt-0.5"
            />
            <span className="text-[13px] leading-relaxed">
              I confirm these samples are{" "}
              <strong className="font-semibold">
                research materials not intended for human or veterinary use
              </strong>
              , that they fall within the laboratory&apos;s accepted scope, and that
              I accept the{" "}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-lava-600 underline underline-offset-4 dark:text-lava-400"
              >
                terms of service
              </a>
              . I understand results are reported exactly as measured and will not
              be withdrawn on request.
            </span>
          </label>
          <FieldError message={errors.acceptTerms?.message} />
        </div>
      </Card>
    </div>
  );
}
