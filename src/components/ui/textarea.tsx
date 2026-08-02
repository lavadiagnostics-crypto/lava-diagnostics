import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-[104px] w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-[15px] leading-relaxed transition-colors",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-lava-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lava-500/20",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        invalid &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
