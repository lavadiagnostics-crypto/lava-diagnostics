"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/utils";

/**
 * Analytics charts.
 *
 * Colours are read from CSS custom properties so both themes are handled by one
 * definition, and the categorical palette is ordered by semantic meaning
 * (pass/fail/pending) rather than by index.
 */

const AXIS_STYLE = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
};

/** Shared tooltip shell so all three charts read identically. */
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lift">
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      ) : null}
      {payload.map((entry, index) => (
        <p key={index} className="mt-1 flex items-center gap-2 text-[13px]">
          {entry.color ? (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
          ) : null}
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="tabular font-semibold">
            {formatter && typeof entry.value === "number"
              ? formatter(entry.value)
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function SubmissionsChart({
  data,
}: {
  data: { month: string; orders: number; samples: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-orders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5B2E" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#FF5B2E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fill-samples" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F1F1F" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#1F1F1F" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />

        <Area
          type="monotone"
          dataKey="samples"
          name="Samples"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          fill="url(#fill-samples)"
        />
        <Area
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke="#FF5B2E"
          strokeWidth={2}
          fill="url(#fill-orders)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({
  data,
}: {
  data: { month: string; revenueCents: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) =>
            `$${Math.round(value / 100).toLocaleString()}`
          }
          width={64}
        />
        <Tooltip
          content={<ChartTooltip formatter={(value) => formatCents(value)} />}
          cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar
          dataKey="revenueCents"
          name="Collected"
          fill="#FF5B2E"
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Semantic colours — PASS green, FAIL red, INCONCLUSIVE amber. */
const RESULT_COLOURS: Record<string, string> = {
  Pass: "hsl(152 62% 40%)",
  Fail: "hsl(0 74% 52%)",
  Inconclusive: "hsl(38 92% 50%)",
};

export function ResultsChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No certificates issued yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={RESULT_COLOURS[entry.name] ?? "hsl(var(--muted-foreground))"}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="w-full shrink-0 space-y-3 sm:w-40">
        {data.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  background:
                    RESULT_COLOURS[entry.name] ?? "hsl(var(--muted-foreground))",
                }}
              />
              {entry.name}
            </span>
            <span className="tabular font-semibold">
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
