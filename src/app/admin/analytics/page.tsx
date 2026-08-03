import type { Metadata } from "next";
import {
  Activity,
  Eye,
  FlaskConical,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { SectionHeading } from "@/components/shared/empty-state";
import { StatTile } from "@/components/shared/stat-tile";
import {
  ResultsChart,
  RevenueChart,
  SubmissionsChart,
} from "@/app/admin/analytics/charts";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/utils";
import { TEST_CATALOG } from "@/lib/pricing";

export const metadata: Metadata = { title: "Analytics" };

/** Rolling 12-month buckets, oldest first. */
function monthBuckets(count = 12) {
  const buckets: { key: string; label: string; start: Date; end: Date }[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1),
    );
    buckets.push({
      key: `${start.getUTCFullYear()}-${start.getUTCMonth()}`,
      label: start.toLocaleDateString("en-GB", {
        month: "short",
        timeZone: "UTC",
      }),
      start,
      end,
    });
  }
  return buckets;
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const buckets = monthBuckets(12);
  const windowStart = buckets[0].start;

  const [orders, invoices, certificates, samples, verificationStats] =
    await Promise.all([
      prisma.order.findMany({
        where: { submittedAt: { gte: windowStart } },
        select: {
          submittedAt: true,
          _count: { select: { samples: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { status: "PAID", paidAt: { gte: windowStart } },
        select: { paidAt: true, totalCents: true },
      }),
      prisma.certificate.groupBy({
        by: ["result"],
        where: { status: { in: ["VERIFIED", "REVOKED"] } },
        _count: true,
      }),
      prisma.sample.findMany({
        select: {
          testPurity: true,
          testIdentity: true,
          testContent: true,
          testSterility: true,
          testEndotoxin: true,
          testHeavyMetals: true,
          testResidualSolvents: true,
          testConformity: true,
          testPhoto: true,
        },
      }),
      prisma.certificateAccessLog.groupBy({
        by: ["success"],
        _count: true,
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  // ── Build chart series ──
  const submissionSeries = buckets.map((bucket) => {
    const inBucket = orders.filter(
      (o) => o.submittedAt >= bucket.start && o.submittedAt < bucket.end,
    );
    return {
      month: bucket.label,
      orders: inBucket.length,
      samples: inBucket.reduce((sum, o) => sum + o._count.samples, 0),
    };
  });

  const revenueSeries = buckets.map((bucket) => ({
    month: bucket.label,
    revenueCents: invoices
      .filter(
        (inv) =>
          inv.paidAt && inv.paidAt >= bucket.start && inv.paidAt < bucket.end,
      )
      .reduce((sum, inv) => sum + inv.totalCents, 0),
  }));

  const resultSeries = [
    {
      name: "Pass",
      value: certificates.find((c) => c.result === "PASS")?._count ?? 0,
    },
    {
      name: "Fail",
      value: certificates.find((c) => c.result === "FAIL")?._count ?? 0,
    },
    {
      name: "Inconclusive",
      value:
        certificates.find((c) => c.result === "INCONCLUSIVE")?._count ?? 0,
    },
  ];

  // ── Assay popularity ──
  const testColumns: Record<string, keyof (typeof samples)[number]> = {
    purity: "testPurity",
    identity: "testIdentity",
    content: "testContent",
    sterility: "testSterility",
    endotoxin: "testEndotoxin",
    heavyMetals: "testHeavyMetals",
    residualSolvents: "testResidualSolvents",
    conformity: "testConformity",
    photo: "testPhoto",
  };

  const assayCounts = TEST_CATALOG.map((test) => ({
    label: test.shortLabel,
    count: samples.filter((s) => s[testColumns[test.key]] === true).length,
  })).sort((a, b) => b.count - a.count);

  const maxAssayCount = Math.max(1, ...assayCounts.map((a) => a.count));

  // ── Headline figures ──
  const totalOrders = orders.length;
  const totalSamples = orders.reduce((sum, o) => sum + o._count.samples, 0);
  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalCents, 0);

  const passCount = resultSeries[0].value;
  const totalResults = resultSeries.reduce((sum, r) => sum + r.value, 0);
  const passRate =
    totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

  const successfulLookups =
    verificationStats.find((s) => s.success)?._count ?? 0;
  const failedLookups =
    verificationStats.find((s) => !s.success)?._count ?? 0;

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        overline="Administration"
        title="Analytics"
        description="Submission volume, revenue and result distribution over the last twelve months."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Orders, 12 months"
          value={totalOrders}
          icon={FlaskConical}
          tone="primary"
        />
        <StatTile
          label="Samples analysed"
          value={totalSamples}
          icon={Activity}
        />
        <StatTile
          label="Collected, 12 months"
          value={formatCents(totalRevenue)}
          icon={TrendingUp}
          tone="pass"
        />
        <StatTile
          label="Pass rate"
          value={`${passRate}%`}
          icon={ShieldCheck}
          tone={passRate >= 80 ? "pass" : "pending"}
          hint={`${totalResults} certificate${totalResults === 1 ? "" : "s"} issued`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">
            Submission volume
          </h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Orders and sample lines received each month.
          </p>
          <Separator className="my-5" />
          <SubmissionsChart data={submissionSeries} />
        </Card>

        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">
            Revenue collected
          </h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Invoices marked paid, by month of payment.
          </p>
          <Separator className="my-5" />
          <RevenueChart data={revenueSeries} />
        </Card>

        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">
            Result distribution
          </h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Across all issued certificates.
          </p>
          <Separator className="my-5" />
          <ResultsChart data={resultSeries} />
        </Card>

        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">
            Assay demand
          </h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Sample lines ordering each analysis.
          </p>
          <Separator className="my-5" />

          <ul className="space-y-3.5">
            {assayCounts.map((assay) => (
              <li key={assay.label}>
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate">{assay.label}</span>
                  <span className="tabular shrink-0 font-semibold">
                    {assay.count}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-lava-gradient transition-all"
                    style={{
                      width: `${(assay.count / maxAssayCount) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── Verification activity ── */}
      <Card className="mt-6 p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <Eye className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight">
            Verification activity, last 30 days
          </h2>
        </div>
        <Separator className="my-5" />

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="tabular text-3xl font-semibold tracking-tight text-[hsl(var(--pass))]">
              {successfulLookups}
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Successful lookups
            </p>
          </div>
          <div>
            <p className="tabular text-3xl font-semibold tracking-tight text-muted-foreground">
              {failedLookups}
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Failed lookups
            </p>
          </div>
          <div>
            <p className="tabular text-3xl font-semibold tracking-tight">
              {successfulLookups + failedLookups > 0
                ? Math.round(
                    (failedLookups / (successfulLookups + failedLookups)) * 100,
                  )
                : 0}
              %
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Failure rate
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-[13px] leading-relaxed text-muted-foreground">
          A sustained high failure rate can indicate an enumeration attempt - the
          verification endpoint locks out an address after repeated failures
          within an hour. It can equally indicate a certificate number printed
          incorrectly on physical documentation, so check recent releases before
          assuming abuse.
        </p>
      </Card>
    </div>
  );
}
