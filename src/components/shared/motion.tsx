"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Motion primitives.
 *
 * Every component here honours `prefers-reduced-motion` by collapsing to an
 * instant, static render rather than a faster animation — a shortened animation
 * still moves, which is the thing the preference asks us not to do.
 *
 * Props extend `HTMLMotionProps<"div">` rather than `React.HTMLAttributes`
 * because Framer redefines pointer/drag handlers with its own signatures, and
 * mixing the two produces an incompatible `onDrag`.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  /** Vertical travel distance in pixels. */
  y?: number;
}

/** Fades and lifts its children the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-72px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? undefined : { opacity: 0, y }}
      animate={reduced ? undefined : inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers `RevealItem` children into view. */
export function RevealGroup({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-72px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={reduced ? undefined : stagger}
      initial={reduced ? undefined : "hidden"}
      animate={reduced ? undefined : inView ? "visible" : "hidden"}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : fadeUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when scrolled into view. */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1.4,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (!inView) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      // Ease-out cubic so the count decelerates into its final value.
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {prefix}
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/** Success checkmark that draws itself, used on confirmation screens. */
export function SuccessCheck({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex size-[68px] items-center justify-center rounded-full bg-[hsl(var(--pass)/0.12)]",
        className,
      )}
    >
      {!reduced && (
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[hsl(var(--pass)/0.22)]" />
      )}
      <svg
        viewBox="0 0 52 52"
        className="relative size-9 text-[hsl(var(--pass))]"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <motion.path
          d="M14 27l8.5 8.5L38 19"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
