import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Dashboard metric tile.
 *
 * The trend arrow is only rendered when a delta is supplied - a tile showing
 * "0%" with no comparison period is noise, not information.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Percentage change against the previous period. */
  delta?: number;
  tone?: "default" | "primary" | "pass" | "fail" | "pending";
  className?: string;
}) {
  const toneClasses = {
    default: "bg-muted text-foreground",
    primary: "bg-lava-50 text-lava-600 dark:bg-lava-950/45 dark:text-lava-400",
    pass: "bg-[hsl(var(--pass)/0.12)] text-[hsl(var(--pass))]",
    fail: "bg-[hsl(var(--fail)/0.12)] text-[hsl(var(--fail))]",
    pending: "bg-[hsl(var(--pending)/0.14)] text-[hsl(var(--pending))]",
  }[tone];

  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const isUp = hasDelta && delta > 0;

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            toneClasses,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>

        {hasDelta && delta !== 0 ? (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular",
              isUp
                ? "bg-[hsl(var(--pass)/0.12)] text-[hsl(var(--pass))]"
                : "bg-[hsl(var(--fail)/0.12)] text-[hsl(var(--fail))]",
            )}
          >
            {isUp ? (
              <TrendingUp className="size-3" aria-hidden />
            ) : (
              <TrendingDown className="size-3" aria-hidden />
            )}
            {Math.abs(delta)}%
          </span>
        ) : null}
      </div>

      <p className="tabular mt-5 text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        {label}
      </p>
      {hint ? (
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground/85">
          {hint}
        </p>
      ) : null}
    </Card>
  );
}
