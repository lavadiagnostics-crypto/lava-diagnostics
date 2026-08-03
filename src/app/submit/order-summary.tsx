"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Package, Tag, TestTube, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/misc";
import { formatCents } from "@/lib/utils";
import {
  EXPEDITE_SURCHARGE_PERCENT,
  estimatedTurnaround,
  type PriceBreakdown,
  type PriceableOrder,
} from "@/lib/pricing";

/**
 * Live order summary.
 *
 * Displays the same `PriceBreakdown` the server will recompute, so what the
 * client sees and what they are billed derive from one module. Values animate on
 * change to make the effect of a selection obvious.
 */

function AnimatedAmount({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={cents}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.18 }}
        className={className}
      >
        {formatCents(cents)}
      </motion.span>
    </AnimatePresence>
  );
}

export function OrderSummary({
  pricing,
  order,
  sampleNames,
  className,
}: {
  pricing: PriceBreakdown;
  order: PriceableOrder;
  /** Display label per sample line, positionally matched to pricing.lines. */
  sampleNames: string[];
  className?: string;
}) {
  const hasAnything = pricing.subtotalCents > 0;
  const turnaround = estimatedTurnaround(order);

  return (
    <div
      className={className}
      aria-live="polite"
      aria-label="Order summary and estimated total"
    >
      <div className="overflow-hidden rounded-3xl border border-border bg-charcoal-900 text-white dark:border-border">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-overline text-lava-400">
            Order Summary
          </p>
        </div>

        <div className="px-6 py-5">
          {!hasAnything ? (
            <div className="py-6 text-center">
              <TestTube
                className="mx-auto size-7 text-white/25"
                aria-hidden
              />
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                Add a sample and choose its analyses to see your estimate build
                up here.
              </p>
            </div>
          ) : (
            <>
              {/* Per-sample line items */}
              <ul className="space-y-5">
                {pricing.lines.map((line) => {
                  if (line.items.length === 0) return null;
                  return (
                    <li key={line.index}>
                      <p className="truncate text-[13px] font-semibold text-white/90">
                        {sampleNames[line.index]?.trim() ||
                          `Sample ${line.index + 1}`}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {line.items.map((item) => (
                          <li
                            key={item.key}
                            className="flex items-baseline justify-between gap-3 text-[13px]"
                          >
                            <span className="min-w-0 text-white/55">
                              {item.label}
                              {item.qty > 1 ? (
                                <span className="text-white/40"> × {item.qty}</span>
                              ) : null}
                            </span>
                            <span className="tabular shrink-0 text-white/80">
                              {item.amountCents === 0
                                ? "Free"
                                : formatCents(item.amountCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>

              <Separator className="my-5 bg-white/10" />

              {/* Adjustments */}
              <dl className="space-y-2.5 text-[13px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-white/55">Subtotal</dt>
                  <dd className="tabular text-white/85">
                    <AnimatedAmount cents={pricing.subtotalCents} />
                  </dd>
                </div>

                {pricing.discountCents > 0 ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="flex items-center gap-1.5 text-[hsl(var(--pass))]">
                      <Tag className="size-3" aria-hidden />
                      Volume discount ({pricing.discountPercent}%)
                    </dt>
                    <dd className="tabular text-[hsl(var(--pass))]">
                      −{formatCents(pricing.discountCents)}
                    </dd>
                  </div>
                ) : null}

                {pricing.expediteCents > 0 ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="flex items-center gap-1.5 text-lava-400">
                      <Zap className="size-3" aria-hidden />
                      Expedited (+{EXPEDITE_SURCHARGE_PERCENT}%)
                    </dt>
                    <dd className="tabular text-lava-400">
                      +{formatCents(pricing.expediteCents)}
                    </dd>
                  </div>
                ) : null}

                {pricing.additionalCoaCents > 0 ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-white/55">Additional COA names</dt>
                    <dd className="tabular text-white/85">
                      +{formatCents(pricing.additionalCoaCents)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-white/10 bg-white/[0.03] px-6 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-overline text-white/50">
                Estimated Total
              </p>
              <p className="mt-1 text-[11px] text-white/35">
                {pricing.sampleCount} sample
                {pricing.sampleCount === 1 ? "" : " lines"}
              </p>
            </div>
            <div className="tabular text-3xl font-semibold tracking-tight">
              <AnimatedAmount cents={pricing.totalCents} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/20 text-white/65">
              <Package aria-hidden />
              {pricing.requiredVials} vial
              {pricing.requiredVials === 1 ? "" : "s"} to ship
            </Badge>
            {turnaround !== "-" ? (
              <Badge variant="outline" className="border-white/20 text-white/65">
                {turnaround}
              </Badge>
            ) : null}
          </div>

          <p className="mt-5 flex gap-2 text-[11px] leading-relaxed text-white/40">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0 cursor-help">
                  <Info className="size-3.5" aria-hidden />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Volume tiers are estimated from this order alone. At invoicing we
                apply the tier earned by your total monthly volume, so your
                invoice may be lower than this estimate - never higher.
              </TooltipContent>
            </Tooltip>
            <span>
              Estimate only. Confirmed at invoicing, where volume tiers are
              applied against your monthly total.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
