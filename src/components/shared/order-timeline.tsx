import { Check } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_META, ORDER_TIMELINE } from "@/components/shared/status";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * Customer-facing progress timeline.
 *
 * Off-track statuses (REJECTED, CANCELLED) are not positions on the happy path,
 * so they replace the timeline rather than being squeezed into it.
 */
export function OrderTimeline({
  status,
  events,
  className,
}: {
  status: OrderStatus;
  events: { status: OrderStatus; createdAt: Date; note: string | null }[];
  className?: string;
}) {
  const terminal = status === "REJECTED" || status === "CANCELLED";

  if (terminal) {
    const meta = ORDER_STATUS_META[status];
    const Icon = meta.icon;
    const event = events.find((e) => e.status === status);

    return (
      <div
        className={cn(
          "flex gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-5",
          className,
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight">
            {meta.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {event?.note || meta.description}
          </p>
          {event ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDateTime(event.createdAt)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_META[status].step ?? 1;

  /** Latest event for a status, so a re-entered status shows its newest note. */
  function eventFor(target: OrderStatus) {
    return events.filter((e) => e.status === target).at(-1);
  }

  return (
    <ol className={cn("relative", className)}>
      {ORDER_TIMELINE.map((timelineStatus, index) => {
        const meta = ORDER_STATUS_META[timelineStatus];
        const step = meta.step ?? 0;
        const isDone = step < currentStep;
        const isCurrent = step === currentStep;
        const isFuture = step > currentStep;
        const event = eventFor(timelineStatus);
        const Icon = meta.icon;
        const isLast = index === ORDER_TIMELINE.length - 1;

        return (
          <li key={timelineStatus} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Connector */}
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[19px] top-10 h-[calc(100%-16px)] w-0.5 rounded-full",
                  isDone ? "bg-lava-500" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isDone
                  ? "border-lava-500 bg-lava-500 text-white"
                  : isCurrent
                    ? "border-lava-500 bg-background text-lava-600 dark:text-lava-400"
                    : "border-border bg-background text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check className="size-4 stroke-[3]" aria-hidden />
              ) : (
                <Icon className="size-4" aria-hidden />
              )}

              {/* Pulse on the active step */}
              {isCurrent ? (
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full bg-lava-500/30"
                  aria-hidden
                />
              ) : null}
            </span>

            <div className={cn("min-w-0 pt-1.5", isFuture && "opacity-55")}>
              <p
                className={cn(
                  "text-[15px] font-semibold tracking-tight",
                  isCurrent && "text-lava-700 dark:text-lava-400",
                )}
              >
                {meta.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {event?.note || meta.description}
              </p>
              {event ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatDateTime(event.createdAt)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
