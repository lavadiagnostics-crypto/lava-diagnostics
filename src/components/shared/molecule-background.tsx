"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Decorative molecular lattice used behind hero sections.
 *
 * Deterministic geometry rather than random placement, so the layout is stable
 * between server and client renders and does not cause hydration mismatches.
 * Purely decorative and hidden from assistive technology.
 */

interface Node {
  x: number;
  y: number;
  r: number;
}

/** Hand-placed nodes forming a loose peptide-backbone motif. */
const NODES: Node[] = [
  { x: 60, y: 190, r: 3.5 },
  { x: 140, y: 120, r: 5 },
  { x: 232, y: 168, r: 3 },
  { x: 300, y: 92, r: 4.5 },
  { x: 388, y: 148, r: 3 },
  { x: 452, y: 74, r: 5.5 },
  { x: 540, y: 132, r: 3.5 },
  { x: 618, y: 66, r: 4 },
  { x: 700, y: 140, r: 3 },
  { x: 176, y: 268, r: 4 },
  { x: 268, y: 322, r: 3 },
  { x: 364, y: 262, r: 5 },
  { x: 468, y: 318, r: 3.5 },
  { x: 566, y: 256, r: 4 },
  { x: 664, y: 306, r: 3 },
  { x: 748, y: 232, r: 4.5 },
];

/** Index pairs describing which nodes are bonded. */
const BONDS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
  [1, 9], [3, 11], [6, 13], [8, 15], [2, 11], [5, 13],
];

export function MoleculeBackground({
  className,
  intensity = "default",
}: {
  className?: string;
  intensity?: "subtle" | "default";
}) {
  const reduced = useReducedMotion();
  const opacity = intensity === "subtle" ? 0.5 : 1;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        style={{ opacity }}
      >
        <defs>
          <linearGradient id="lava-bond" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF5B2E" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#FF5B2E" stopOpacity="0.06" />
          </linearGradient>
          <radialGradient id="lava-node">
            <stop offset="0%" stopColor="#FF5B2E" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FF5B2E" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        <g stroke="url(#lava-bond)" strokeWidth="1.15">
          {BONDS.map(([from, to], i) => (
            <motion.line
              key={`bond-${i}`}
              x1={NODES[from].x}
              y1={NODES[from].y}
              x2={NODES[to].x}
              y2={NODES[to].y}
              initial={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.1,
                delay: reduced ? 0 : 0.25 + i * 0.045,
                ease: "easeOut",
              }}
            />
          ))}
        </g>

        <g fill="url(#lava-node)">
          {NODES.map((node, i) => (
            <motion.circle
              key={`node-${i}`}
              cx={node.x}
              cy={node.y}
              r={node.r}
              initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: reduced ? 0 : 0.45 + i * 0.055,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * Softly drifting colour wash. Two offset radial gradients; the drift animation
 * is disabled under reduced-motion but the gradients remain.
 */
export function AuroraBackground({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className={cn(
          "absolute -left-[12%] -top-[38%] size-[620px] rounded-full opacity-[0.16] blur-3xl dark:opacity-[0.11]",
          !reduced && "animate-drift",
        )}
        style={{
          background:
            "radial-gradient(circle at center, #FF5B2E 0%, transparent 68%)",
        }}
      />
      <div
        className={cn(
          "absolute -right-[10%] top-[8%] size-[520px] rounded-full opacity-[0.13] blur-3xl dark:opacity-[0.09]",
          !reduced && "animate-drift",
        )}
        style={{
          background:
            "radial-gradient(circle at center, #FF7C5C 0%, transparent 70%)",
          animationDelay: "-6s",
        }}
      />
    </div>
  );
}
