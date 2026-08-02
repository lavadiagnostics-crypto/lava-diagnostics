"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  title: string;
  description: string;
}

export const SUBMISSION_STEPS: Step[] = [
  {
    id: 1,
    title: "Contact",
    description: "Who you are and where samples ship from",
  },
  {
    id: 2,
    title: "Samples",
    description: "What to test and which analyses to run",
  },
  { id: 3, title: "Review", description: "Confirm and submit" },
];

/**
 * Progress indicator.
 *
 * Completed steps are clickable so a user can go back and correct something
 * without losing what they have entered; steps ahead of the current one are not,
 * because they may depend on validation that has not run yet.
 */
export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}) {
  return (
    <nav aria-label="Submission progress">
      <ol className="flex items-start gap-2 sm:gap-4">
        {SUBMISSION_STEPS.map((step, index) => {
          const isComplete = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isComplete && !isCurrent;

          return (
            <li key={step.id} className="flex flex-1 items-start gap-2 sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-col">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl text-left transition-opacity",
                    isClickable
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-semibold transition-all duration-300",
                      isComplete
                        ? "border-lava-500 bg-lava-500 text-white"
                        : isCurrent
                          ? "border-lava-500 bg-background text-lava-600 dark:text-lava-400"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="size-4 stroke-[3]" aria-hidden />
                      </motion.span>
                    ) : (
                      step.id
                    )}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-sm font-semibold tracking-tight transition-colors",
                        isCurrent || isComplete
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="mt-0.5 hidden truncate text-xs text-muted-foreground lg:block">
                      {step.description}
                    </span>
                  </span>
                </button>
              </div>

              {index < SUBMISSION_STEPS.length - 1 ? (
                <div
                  className="mt-[18px] h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-border"
                  aria-hidden
                >
                  <motion.div
                    className="h-full rounded-full bg-lava-500"
                    initial={false}
                    animate={{ width: isComplete ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
