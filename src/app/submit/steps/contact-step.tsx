"use client";

import { useFormContext } from "react-hook-form";
import { Mail, MapPin, Receipt, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/misc";
import { ACCEPTED_COUNTRIES } from "@/lib/constants";
import type { SubmissionFormValues } from "@/app/submit/submission-form";

/** Inline validation message wired to its field via aria-describedby. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-destructive" role="alert">
      {message}
    </p>
  );
}

/** Address block, reused for shipping and billing. */
function AddressFields({ prefix }: { prefix: "shipping" | "billing" }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<SubmissionFormValues>();

  // Errors are nested; index defensively since billing may be absent entirely.
  const group = (errors[prefix] ?? {}) as Record<
    string,
    { message?: string } | undefined
  >;
  const country = watch(`${prefix}.country`);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-line1`} required>
          Address line 1
        </Label>
        <Input
          id={`${prefix}-line1`}
          autoComplete={`${prefix} address-line1`}
          className="mt-2"
          invalid={Boolean(group.line1)}
          aria-describedby={group.line1 ? `${prefix}-line1-error` : undefined}
          {...register(`${prefix}.line1`)}
        />
        <FieldError
          id={`${prefix}-line1-error`}
          message={group.line1?.message}
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-line2`}>
          Address line 2{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${prefix}-line2`}
          autoComplete={`${prefix} address-line2`}
          className="mt-2"
          {...register(`${prefix}.line2`)}
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-city`} required>
          City
        </Label>
        <Input
          id={`${prefix}-city`}
          autoComplete={`${prefix} address-level2`}
          className="mt-2"
          invalid={Boolean(group.city)}
          aria-describedby={group.city ? `${prefix}-city-error` : undefined}
          {...register(`${prefix}.city`)}
        />
        <FieldError id={`${prefix}-city-error`} message={group.city?.message} />
      </div>

      <div>
        <Label htmlFor={`${prefix}-state`}>
          State or province{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${prefix}-state`}
          autoComplete={`${prefix} address-level1`}
          className="mt-2"
          {...register(`${prefix}.state`)}
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-postalCode`} required>
          Postal or ZIP code
        </Label>
        <Input
          id={`${prefix}-postalCode`}
          autoComplete={`${prefix} postal-code`}
          className="mt-2"
          invalid={Boolean(group.postalCode)}
          aria-describedby={
            group.postalCode ? `${prefix}-postalCode-error` : undefined
          }
          {...register(`${prefix}.postalCode`)}
        />
        <FieldError
          id={`${prefix}-postalCode-error`}
          message={group.postalCode?.message}
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-country`} required>
          Country
        </Label>
        {/*
          Radix Select is not a native input, so it is driven through
          setValue/watch rather than register.

          `value` is passed straight through, including the empty string. Coercing
          an empty value to `undefined` would make Radix fall back to its own
          internal state — the trigger would then display a selection that the
          form never received, and validation would fail on a field that looks
          filled. An empty string matches no item, so the placeholder still shows.
        */}
        <Select
          value={country ?? ""}
          onValueChange={(value) =>
            setValue(`${prefix}.country`, value, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger
            id={`${prefix}-country`}
            className="mt-2"
            invalid={Boolean(group.country)}
          >
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {ACCEPTED_COUNTRIES.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          id={`${prefix}-country-error`}
          message={group.country?.message}
        />
      </div>
    </div>
  );
}

export function ContactStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SubmissionFormValues>();

  const billingSame = watch("billingSameAsShipping");
  const marketingOptIn = watch("marketingOptIn");

  return (
    <div className="space-y-6">
      {/* ── Contact details ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5">
          <User className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Contact Information
          </h2>
        </div>
        <Separator className="my-6" />

        <div className="space-y-5">
          <div>
            <Label htmlFor="companyName" required>
              Company, organisation or individual name
            </Label>
            <Input
              id="companyName"
              autoComplete="organization"
              className="mt-2"
              placeholder="Company name, organisation, or your full name"
              invalid={Boolean(errors.companyName)}
              aria-describedby="companyName-help companyName-error"
              {...register("companyName")}
            />
            <p
              id="companyName-help"
              className="mt-2 text-[13px] leading-relaxed text-muted-foreground"
            >
              Individuals are welcome — enter your full name. This appears{" "}
              <strong className="font-semibold text-foreground">
                exactly as entered
              </strong>{" "}
              on your Certificate of Analysis, and it is the only name we put on
              it.
            </p>
            <FieldError
              id="companyName-error"
              message={errors.companyName?.message}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="contactPerson" required>
                Contact person
              </Label>
              <Input
                id="contactPerson"
                autoComplete="name"
                className="mt-2"
                placeholder="Full name"
                invalid={Boolean(errors.contactPerson)}
                aria-describedby={
                  errors.contactPerson ? "contactPerson-error" : undefined
                }
                {...register("contactPerson")}
              />
              <FieldError
                id="contactPerson-error"
                message={errors.contactPerson?.message}
              />
            </div>

            <div>
              <Label htmlFor="phone" required>
                Phone number
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="mt-2"
                placeholder="Include your country code"
                invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                {...register("phone")}
              />
              <FieldError id="phone-error" message={errors.phone?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="email" required>
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-2"
              placeholder="you@company.com"
              invalid={Boolean(errors.email)}
              aria-describedby="email-help email-error"
              {...register("email")}
            />
            <div
              id="email-help"
              className="mt-3 flex gap-3 rounded-xl border border-lava-200 bg-lava-50/60 p-3.5 dark:border-lava-900/70 dark:bg-lava-950/25"
            >
              <Mail
                className="mt-0.5 size-4 shrink-0 text-lava-600 dark:text-lava-400"
                aria-hidden
              />
              <p className="text-[13px] leading-relaxed">
                <strong className="font-semibold">
                  Your certificate is sent here.
                </strong>{" "}
                Please check the spelling carefully — we cannot redeliver to a
                corrected address once a certificate has been released.
              </p>
            </div>
            <FieldError id="email-error" message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="vatNumber">
              VAT or tax registration number{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input id="vatNumber" className="mt-2" {...register("vatNumber")} />
          </div>
        </div>

        <Separator className="my-7" />

        <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-border bg-muted/35 p-4 transition-colors hover:bg-muted/55">
          <Checkbox
            checked={marketingOptIn}
            onCheckedChange={(checked) =>
              setValue("marketingOptIn", checked === true)
            }
            className="mt-0.5"
            aria-describedby="marketing-help"
          />
          <span>
            <span className="block text-sm font-semibold">
              Keep me informed
            </span>
            <span
              id="marketing-help"
              className="mt-1 block text-[13px] leading-relaxed text-muted-foreground"
            >
              Occasional notes about new assays and method updates. Order and
              certificate notifications are sent regardless — this only covers
              announcements, and you can unsubscribe at any time.
            </span>
          </span>
        </label>
      </Card>

      {/* ── Shipping ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5">
          <MapPin className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Shipping Address
          </h2>
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          Where your samples are being sent from, and where retained material
          will be returned.
        </p>
        <Separator className="my-6" />
        <AddressFields prefix="shipping" />
      </Card>

      {/* ── Billing ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5">
          <Receipt className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Billing Address
          </h2>
        </div>
        <Separator className="my-6" />

        <label className="flex cursor-pointer items-center gap-3.5">
          <Checkbox
            checked={billingSame}
            onCheckedChange={(checked) =>
              setValue("billingSameAsShipping", checked === true, {
                shouldValidate: true,
              })
            }
          />
          <span className="text-sm font-medium">
            Billing address is the same as shipping
          </span>
        </label>

        {!billingSame ? (
          <div className="mt-7 border-t border-border pt-7">
            <AddressFields prefix="billing" />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
