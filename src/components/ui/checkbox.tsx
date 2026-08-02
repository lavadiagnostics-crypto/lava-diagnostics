"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-[18px] shrink-0 rounded-[6px] border-[1.5px] border-input bg-background transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lava-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "hover:border-lava-400 disabled:cursor-not-allowed disabled:opacity-45",
      "data-[state=checked]:border-lava-500 data-[state=checked]:bg-lava-500 data-[state=checked]:text-white",
      "data-[state=indeterminate]:border-lava-500 data-[state=indeterminate]:bg-lava-500 data-[state=indeterminate]:text-white",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {props.checked === "indeterminate" ? (
        <Minus className="size-3 stroke-[3.5]" />
      ) : (
        <Check className="size-3 stroke-[3.5]" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
