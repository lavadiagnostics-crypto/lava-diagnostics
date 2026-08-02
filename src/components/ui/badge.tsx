import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-900",
        primary: "border-lava-200 bg-lava-50 text-lava-700 dark:border-lava-900 dark:bg-lava-950/40 dark:text-lava-300",
        outline: "border-border bg-transparent text-muted-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        pass: "border-transparent bg-[hsl(var(--pass)/0.13)] text-[hsl(var(--pass))]",
        fail: "border-transparent bg-[hsl(var(--fail)/0.13)] text-[hsl(var(--fail))]",
        pending: "border-transparent bg-[hsl(var(--pending)/0.15)] text-[hsl(var(--pending))]",
      },
      size: {
        default: "px-2.5 py-0.5",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
