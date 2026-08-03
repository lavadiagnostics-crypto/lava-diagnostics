"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Copy,
  FileStack,
  Package,
  Plus,
  TestTube,
  Trash2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/misc";
import { cn, formatCents } from "@/lib/utils";
import {
  ADDITIONAL_COA_CENTS,
  MAX_ADDITIONAL_COA_NAMES,
  requiredVialsForSample,
  TEST_CATALOG,
  VOLUME_TIERS,
  type TestKey,
} from "@/lib/pricing";
import { EXCLUDED_PRODUCTS } from "@/lib/constants";
import { emptySample } from "@/lib/validations/submission";
import type { SubmissionFormValues } from "@/app/submit/submission-form";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[13px] text-destructive" role="alert">
      {message}
    </p>
  );
}

/**
 * Test selection grid for one sample.
 *
 * Rendered as a grid of toggle cards rather than the dense table in the
 * reference screenshots - the table required a legend to decode and did not
 * survive narrow viewports. Each card states the assay, price and billing basis
 * on its face.
 */
function TestSelector({ sampleIndex }: { sampleIndex: number }) {
  const { watch, setValue, formState } = useFormContext<SubmissionFormValues>();

  const tests = watch(`samples.${sampleIndex}.tests`);
  const quantity = watch(`samples.${sampleIndex}.quantity`) || 1;

  // Zod attaches the "select at least one" error to the `tests` object itself.
  const testsError = (
    formState.errors.samples?.[sampleIndex]?.tests as
      | { message?: string }
      | undefined
  )?.message;

  function toggle(key: TestKey, next: boolean) {
    setValue(`samples.${sampleIndex}.tests.${key}`, next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const allBillable = TEST_CATALOG.filter((t) => t.priceCents > 0);
  const allSelected = allBillable.every((t) => tests?.[t.key]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label required className="text-[13px]">
          Analyses to perform
        </Label>
        <button
          type="button"
          onClick={() => {
            for (const test of allBillable) {
              toggle(test.key, !allSelected);
            }
          }}
          className="text-[13px] font-medium text-lava-600 transition-colors hover:text-lava-700 dark:text-lava-400"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {TEST_CATALOG.map((test) => {
          const checked = Boolean(tests?.[test.key]);
          const lineCost = test.perVial
            ? test.priceCents * quantity
            : test.priceCents;

          return (
            <label
              key={test.key}
              className={cn(
                "group relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all",
                checked
                  ? "border-lava-400 bg-lava-50/70 dark:border-lava-800 dark:bg-lava-950/30"
                  : "border-border bg-background hover:border-lava-200 hover:bg-muted/45 dark:hover:border-lava-900",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => toggle(test.key, value === true)}
                className="mt-0.5"
                aria-label={`${test.label} - ${
                  test.priceCents === 0 ? "free" : formatCents(test.priceCents)
                }`}
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold leading-snug">
                    {test.shortLabel}
                  </span>
                  <span
                    className={cn(
                      "tabular shrink-0 text-[13px] font-semibold",
                      test.priceCents === 0
                        ? "text-[hsl(var(--pass))]"
                        : checked
                          ? "text-lava-700 dark:text-lava-300"
                          : "text-muted-foreground",
                    )}
                  >
                    {test.priceCents === 0 ? "Free" : formatCents(lineCost)}
                  </span>
                </span>

                <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">
                  {test.method}
                </span>

                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {test.perVial && quantity > 1 ? (
                    <Badge variant="muted" className="text-[9px]">
                      × {quantity} vials
                    </Badge>
                  ) : null}
                  {test.requiresExtraVial ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Badge variant="outline" className="text-[9px]">
                            +1 vial
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {test.label} consumes a dedicated unopened vial and
                        cannot share material with other assays.
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <FieldError message={testsError} />
    </div>
  );
}

/** One sample row. */
function SampleCard({
  index,
  total,
  onRemove,
  onDuplicate,
}: {
  index: number;
  total: number;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<SubmissionFormValues>();

  const sample = watch(`samples.${index}`);
  const sampleErrors = errors.samples?.[index];

  const vials = sample
    ? requiredVialsForSample({
        quantity: sample.quantity || 1,
        tests: (sample.tests ?? {}) as Partial<Record<TestKey, boolean>>,
      })
    : 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <Card className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-charcoal-900 text-[13px] font-semibold text-white dark:bg-white dark:text-charcoal-900">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {sample?.productName?.trim() || `Sample ${index + 1}`}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {vials} vial{vials === 1 ? "" : "s"} required
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDuplicate}
                  aria-label={`Duplicate sample ${index + 1}`}
                >
                  <Copy className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate this sample</TooltipContent>
            </Tooltip>

            {total > 1 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label={`Remove sample ${index + 1}`}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove this sample</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor={`sample-${index}-product`} required>
              Product name
            </Label>
            <Input
              id={`sample-${index}-product`}
              className="mt-2"
              placeholder="e.g. BPC-157"
              invalid={Boolean(sampleErrors?.productName)}
              {...register(`samples.${index}.productName`)}
            />
            <FieldError message={sampleErrors?.productName?.message} />
          </div>

          <div>
            <Label htmlFor={`sample-${index}-batch`} required>
              Batch or lot number
            </Label>
            <Input
              id={`sample-${index}-batch`}
              className="mt-2 font-mono text-sm"
              placeholder="e.g. B240612"
              invalid={Boolean(sampleErrors?.batchNumber)}
              {...register(`samples.${index}.batchNumber`)}
            />
            <FieldError message={sampleErrors?.batchNumber?.message} />
          </div>

          <div>
            <Label htmlFor={`sample-${index}-quantity`} required>
              Vials submitted
            </Label>
            <Input
              id={`sample-${index}-quantity`}
              type="number"
              min={1}
              max={500}
              inputMode="numeric"
              className="mt-2 tabular"
              invalid={Boolean(sampleErrors?.quantity)}
              {...register(`samples.${index}.quantity`)}
            />
            <FieldError message={sampleErrors?.quantity?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor={`sample-${index}-peptide`}>
              Expected peptide{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={`sample-${index}-peptide`}
              className="mt-2"
              placeholder="Sequence or common name - used as the identity target"
              {...register(`samples.${index}.expectedPeptide`)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor={`sample-${index}-strength`}>
              Label strength{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={`sample-${index}-strength`}
              className="mt-2"
              placeholder="e.g. 10 mg"
              {...register(`samples.${index}.strength`)}
            />
          </div>
        </div>

        <Separator className="my-6" />

        <TestSelector sampleIndex={index} />

        <div className="mt-6">
          <Label htmlFor={`sample-${index}-notes`}>
            Notes for this sample{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={`sample-${index}-notes`}
            rows={2}
            className="mt-2"
            placeholder="Anything the analyst should know about this specific sample"
            {...register(`samples.${index}.notes`)}
          />
        </div>
      </Card>
    </motion.div>
  );
}

export function SamplesStep() {
  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<SubmissionFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "samples",
  });

  const isExpedited = watch("isExpedited");
  const combineOnSingleCoa = watch("combineOnSingleCoa");
  const additionalCoaNames = watch("additionalCoaNames") ?? [];
  const samples = watch("samples") ?? [];

  const [wantsAdditionalCoa, setWantsAdditionalCoa] = React.useState(
    additionalCoaNames.length > 0,
  );

  const nextTier = VOLUME_TIERS.slice()
    .reverse()
    .find((tier) => samples.length < tier.minSamples);

  return (
    <div className="space-y-6">
      {/* ── Scope warning ── */}
      <Card className="border-destructive/30 bg-destructive/[0.04] p-5">
        <div className="flex gap-3.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <div className="text-[13px] leading-relaxed">
            <strong className="font-semibold">Before you begin.</strong> Samples
            must arrive in crimped, unopened vials. Your Certificate of Analysis
            lists <strong className="font-semibold">only</strong> the name you
            entered on the previous step. We cannot accept {EXCLUDED_PRODUCTS}
          </div>
        </div>
      </Card>

      {/* ── Samples ── */}
      <div className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {fields.map((field, index) => (
            <SampleCard
              key={field.id}
              index={index}
              total={fields.length}
              onRemove={() => remove(index)}
              onDuplicate={() => {
                // Copy everything but the batch number - two samples sharing a
                // batch number is almost always a mistake, and a blank field
                // prompts the user rather than silently duplicating.
                const source = getValues(`samples.${index}`);
                append({ ...source, batchNumber: "" });
              }}
            />
          ))}
        </AnimatePresence>

        {typeof errors.samples?.message === "string" ? (
          <FieldError message={errors.samples.message} />
        ) : null}

        <button
          type="button"
          onClick={() => append(emptySample())}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-muted/25 px-6 py-6 text-sm font-semibold text-muted-foreground transition-all hover:border-lava-300 hover:bg-lava-50/40 hover:text-lava-700 dark:hover:border-lava-900 dark:hover:bg-lava-950/20 dark:hover:text-lava-400"
        >
          <Plus className="size-4" aria-hidden />
          Add another sample
        </button>

        {nextTier ? (
          <p className="text-center text-[13px] text-muted-foreground">
            Add {nextTier.minSamples - samples.length} more sample
            {nextTier.minSamples - samples.length === 1 ? "" : "s"} to reach the{" "}
            <strong className="font-semibold text-foreground">
              {nextTier.percent}% volume discount
            </strong>
            .
          </p>
        ) : (
          <p className="text-center text-[13px] font-medium text-[hsl(var(--pass))]">
            Volume discount applied to this order.
          </p>
        )}
      </div>

      {/* ── Order-level options ── */}
      <Card className="p-7 sm:p-8">
        <div className="flex items-center gap-2.5">
          <FileStack className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Reporting & Handling
          </h2>
        </div>
        <Separator className="my-6" />

        <div className="space-y-4">
          {/* Combine on one COA */}
          <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-border p-4 transition-colors hover:bg-muted/45">
            <Checkbox
              checked={combineOnSingleCoa}
              onCheckedChange={(checked) =>
                setValue("combineOnSingleCoa", checked === true)
              }
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-semibold">
                Combine all analyses for a sample onto one certificate
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                Recommended. Each sample gets a single Certificate of Analysis
                covering every assay you ordered for it. Uncheck to receive a
                separate certificate per assay.
              </span>
            </span>
          </label>

          {/* Expedite */}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-colors",
              isExpedited
                ? "border-lava-400 bg-lava-50/70 dark:border-lava-800 dark:bg-lava-950/30"
                : "border-border hover:bg-muted/45",
            )}
          >
            <Checkbox
              checked={isExpedited}
              onCheckedChange={(checked) =>
                setValue("isExpedited", checked === true)
              }
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                  Expedited processing
                </span>
                <Badge variant="primary">
                  <Zap aria-hidden />
                  +20%
                </Badge>
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                Moves your samples to the front of the analytical queue. Note this
                cannot shorten a fixed incubation - sterility still takes its full
                fourteen days.
              </span>
            </span>
          </label>

          {/* Additional COA names */}
          <div
            className={cn(
              "rounded-2xl border p-4 transition-colors",
              wantsAdditionalCoa ? "border-lava-300 dark:border-lava-900" : "border-border",
            )}
          >
            <label className="flex cursor-pointer items-start gap-3.5">
              <Checkbox
                checked={wantsAdditionalCoa}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  setWantsAdditionalCoa(next);
                  // Clearing the checkbox must also clear the names, otherwise
                  // hidden values would keep being billed.
                  if (!next) setValue("additionalCoaNames", []);
                  else if (additionalCoaNames.length === 0)
                    setValue("additionalCoaNames", [""]);
                }}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Building2
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-sm font-semibold">
                    Issue the COA under additional company names
                  </span>
                  <Badge variant="muted">
                    {formatCents(ADDITIONAL_COA_CENTS)} per sample, per company
                  </Badge>
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                  Up to {MAX_ADDITIONAL_COA_NAMES} additional names. Each becomes
                  a separately signed, separately verifiable certificate.
                </span>
              </span>
            </label>

            {wantsAdditionalCoa ? (
              <div className="mt-5 space-y-2.5 border-t border-border pt-5">
                {Array.from({
                  length: Math.max(1, additionalCoaNames.length),
                }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Additional company name ${i + 1}`}
                      value={additionalCoaNames[i] ?? ""}
                      onChange={(event) => {
                        const next = [...additionalCoaNames];
                        next[i] = event.target.value;
                        setValue("additionalCoaNames", next, {
                          shouldValidate: true,
                        });
                      }}
                      aria-label={`Additional company name ${i + 1}`}
                    />
                    {additionalCoaNames.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove additional name ${i + 1}`}
                        onClick={() =>
                          setValue(
                            "additionalCoaNames",
                            additionalCoaNames.filter((_, j) => j !== i),
                            { shouldValidate: true },
                          )
                        }
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}

                {additionalCoaNames.length < MAX_ADDITIONAL_COA_NAMES ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setValue("additionalCoaNames", [
                        ...additionalCoaNames,
                        "",
                      ])
                    }
                  >
                    <Plus aria-hidden />
                    Add another name
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <Separator className="my-7" />

        <div>
          <Label htmlFor="specialInstructions">
            Special instructions for the laboratory{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="specialInstructions"
            rows={4}
            className="mt-2"
            placeholder="Handling requirements, deadlines, context that would help the analyst, or anything unusual about this shipment."
            {...register("specialInstructions")}
          />
        </div>
      </Card>

      {/* ── Shipping reminder ── */}
      <Card className="bg-muted/45 p-6">
        <div className="flex gap-3.5">
          <Package
            className="mt-0.5 size-4 shrink-0 text-lava-500"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold">
              Check your vial count before shipping
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Sterility and endotoxin testing each consume a dedicated unopened
              vial. The order summary shows the total number of vials to send - sending too few is the most common cause of delay.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
        <TestTube className="size-3.5" aria-hidden />
        {samples.length} sample line{samples.length === 1 ? "" : "s"} on this
        order
      </div>
    </div>
  );
}
