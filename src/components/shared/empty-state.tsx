import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent empty state for every list surface in the product. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/25 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-background shadow-subtle">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-balance text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** Section heading used across dashboard pages. */
export function SectionHeading({
  overline,
  title,
  description,
  action,
  className,
}: {
  overline?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {overline ? <p className="overline mb-2.5">{overline}</p> : null}
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Label/value pair used in detail panels and certificate metadata. */
export function DataField({
  label,
  children,
  mono,
  className,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="overline mb-1.5">{label}</dt>
      <dd
        className={cn(
          "break-words text-[15px] font-medium leading-snug",
          mono && "font-mono text-sm tracking-tight",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
