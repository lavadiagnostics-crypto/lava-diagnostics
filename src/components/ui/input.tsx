import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders the error state. Pair with aria-describedby on the message. */
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-[15px] transition-colors",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-lava-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lava-500/20 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        invalid &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
