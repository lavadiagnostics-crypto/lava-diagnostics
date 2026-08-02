"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { updateProfile } from "@/app/actions/profile";
import { ACCEPTED_COUNTRIES } from "@/lib/constants";

export interface ProfileFormValues {
  companyName: string;
  contactPerson: string;
  phone: string;
  vatNumber: string;
  marketingOptIn: boolean;
  shipping: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export function ProfileForm({ defaults }: { defaults: ProfileFormValues }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({ defaultValues: defaults });

  const marketingOptIn = watch("marketingOptIn");
  const country = watch("shipping.country");

  async function onSubmit(values: ProfileFormValues) {
    const result = await updateProfile(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof ProfileFormValues, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
      toast.error(result.message ?? "Could not save your changes.");
      return;
    }

    toast.success(result.message ?? "Saved.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="companyName" required>
          Company, organisation or your name
        </Label>
        <Input
          id="companyName"
          className="mt-2"
          invalid={Boolean(errors.companyName)}
          {...register("companyName")}
        />
        {errors.companyName ? (
          <p className="mt-1.5 text-[13px] text-destructive" role="alert">
            {errors.companyName.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactPerson" required>
            Contact person
          </Label>
          <Input
            id="contactPerson"
            className="mt-2"
            invalid={Boolean(errors.contactPerson)}
            {...register("contactPerson")}
          />
        </div>

        <div>
          <Label htmlFor="phone" required>
            Phone number
          </Label>
          <Input
            id="phone"
            type="tel"
            className="mt-2"
            invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="vatNumber">
          VAT or tax registration number{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="vatNumber" className="mt-2" {...register("vatNumber")} />
      </div>

      <div className="border-t border-border pt-5">
        <p className="overline mb-4">Default shipping address</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="shipping-line1">Address line 1</Label>
            <Input
              id="shipping-line1"
              className="mt-2"
              {...register("shipping.line1")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="shipping-line2">Address line 2</Label>
            <Input
              id="shipping-line2"
              className="mt-2"
              {...register("shipping.line2")}
            />
          </div>
          <div>
            <Label htmlFor="shipping-city">City</Label>
            <Input
              id="shipping-city"
              className="mt-2"
              {...register("shipping.city")}
            />
          </div>
          <div>
            <Label htmlFor="shipping-state">State or province</Label>
            <Input
              id="shipping-state"
              className="mt-2"
              {...register("shipping.state")}
            />
          </div>
          <div>
            <Label htmlFor="shipping-postalCode">Postal or ZIP code</Label>
            <Input
              id="shipping-postalCode"
              className="mt-2"
              {...register("shipping.postalCode")}
            />
          </div>
          <div>
            <Label htmlFor="shipping-country">Country</Label>
            {/* Passed through verbatim — see the note in submit/steps/contact-step.tsx. */}
            <Select
              value={country ?? ""}
              onValueChange={(value) =>
                setValue("shipping.country", value, { shouldDirty: true })
              }
            >
              <SelectTrigger id="shipping-country" className="mt-2">
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
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3.5 border-t border-border pt-5">
        <Checkbox
          checked={marketingOptIn}
          onCheckedChange={(checked) =>
            setValue("marketingOptIn", checked === true, { shouldDirty: true })
          }
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed">
          Send me occasional notes about new assays and method updates. Order and
          certificate notifications are sent regardless.
        </span>
      </label>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {!isSubmitting ? <Save aria-hidden /> : null}
          Save changes
        </Button>
      </div>
    </form>
  );
}
