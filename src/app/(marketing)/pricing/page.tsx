import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Info, Receipt, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { formatCents } from "@/lib/utils";
import {
  ADDITIONAL_COA_CENTS,
  EXPEDITE_SURCHARGE_PERCENT,
  TEST_CATALOG,
  VOLUME_TIERS,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing & Turnaround",
  description:
    "Transparent per-assay pricing for independent research peptide testing, with volume tiers, expedited processing and no hidden fees.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/pricing" },
};

/** Representative bundles, priced from the same catalogue as the form. */
const BUNDLES = [
  {
    name: "Identity Check",
    tagline: "Confirm you received what you ordered",
    tests: ["purity", "identity", "photo"] as const,
    for: "Spot-checking a new supplier, or confirming a substitution suspicion.",
    featured: false,
  },
  {
    name: "Release Panel",
    tagline: "The standard for material you resell",
    tests: ["purity", "identity", "content", "photo"] as const,
    for: "Making a defensible label claim rather than repeating your supplier's.",
    featured: true,
  },
  {
    name: "Full Characterisation",
    tagline: "Every question answered",
    tests: [
      "purity",
      "identity",
      "content",
      "endotoxin",
      "heavyMetals",
      "residualSolvents",
      "photo",
    ] as const,
    for: "Qualifying a new manufacturing source, or responding to a complaint.",
    featured: false,
  },
];

function bundleTotal(keys: readonly string[]): number {
  return TEST_CATALOG.filter((t) => keys.includes(t.key)).reduce(
    (sum, t) => sum + t.priceCents,
    0,
  );
}

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />
        <div className="container relative py-20 sm:py-28">
          <Reveal className="max-w-3xl">
            <Badge variant="primary" size="lg" className="mb-7">
              <Receipt aria-hidden />
              Pricing
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-6xl">
              Priced per assay. No surprises at invoicing.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              You pay for the analyses you select, on the samples you send. There
              is no account fee, no minimum order, and no charge difference
              between a passing and a failing result.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Bundles ────────────────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <RevealGroup className="grid gap-6 lg:grid-cols-3">
          {BUNDLES.map((bundle) => (
            <RevealItem key={bundle.name}>
              <Card
                className={
                  bundle.featured
                    ? "relative flex h-full flex-col border-2 border-lava-500 p-8 shadow-card"
                    : "flex h-full flex-col p-8"
                }
              >
                {bundle.featured ? (
                  <Badge
                    variant="primary"
                    className="absolute -top-3 left-8 border-lava-500 bg-lava-500 text-white"
                  >
                    Most ordered
                  </Badge>
                ) : null}

                <h2 className="text-xl font-semibold tracking-tight">
                  {bundle.name}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {bundle.tagline}
                </p>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className="tabular text-4xl font-semibold tracking-tightest">
                    {formatCents(bundleTotal(bundle.tests))}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / sample
                  </span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {TEST_CATALOG.filter((t) =>
                    bundle.tests.includes(t.key as never),
                  ).map((test) => (
                    <li key={test.key} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-lava-500"
                        aria-hidden
                      />
                      <span className="text-[15px] leading-snug">
                        {test.label}
                        {test.priceCents === 0 ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (free)
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-7 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
                  {bundle.for}
                </p>

                <Button
                  className="mt-7 w-full"
                  variant={bundle.featured ? "default" : "outline"}
                  asChild
                >
                  <Link href="/submit">
                    Select in submission
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-8" delay={0.1}>
          <p className="text-center text-sm text-muted-foreground">
            Bundles are conveniences, not packages — you can select any
            combination of assays per sample in the submission form.
          </p>
        </Reveal>
      </section>

      {/* ── Full price list ────────────────────────────────── */}
      <section className="border-y border-border bg-muted/35 py-20 sm:py-28">
        <div className="container">
          <Reveal className="max-w-3xl">
            <p className="overline mb-4">Complete Price List</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.1]">
              Every assay we offer
            </h2>
          </Reveal>

          <Reveal className="mt-12" delay={0.08}>
            <Card className="overflow-hidden bg-background p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/55 hover:bg-muted/55">
                    <TableHead className="pl-6">Analysis</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Turnaround</TableHead>
                    <TableHead className="text-right">Basis</TableHead>
                    <TableHead className="pr-6 text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TEST_CATALOG.map((test) => (
                    <TableRow key={test.key}>
                      <TableCell className="pl-6">
                        <div className="font-semibold">{test.label}</div>
                        {test.requiresExtraVial ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Requires a dedicated unopened vial
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-[13px] text-muted-foreground">
                        {test.method}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {test.turnaround}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {test.perVial ? "per vial" : "per sample"}
                      </TableCell>
                      <TableCell className="tabular pr-6 text-right font-semibold">
                        {test.priceCents === 0 ? (
                          <Badge variant="pass">Free</Badge>
                        ) : (
                          formatCents(test.priceCents)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── Adjustments ────────────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <Reveal className="max-w-3xl">
          <p className="overline mb-4">Adjustments</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.1]">
            Discounts and surcharges, stated up front
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
          <RevealItem>
            <Card className="h-full p-7">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--pass)/0.12)] text-[hsl(var(--pass))]">
                <Receipt className="size-5" aria-hidden />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                Volume tiers
              </h3>
              <ul className="mt-4 space-y-2.5">
                {VOLUME_TIERS.map((tier) => (
                  <li
                    key={tier.minSamples}
                    className="flex items-center justify-between text-[15px]"
                  >
                    <span className="text-muted-foreground">
                      {tier.minSamples}+ sample lines
                    </span>
                    <span className="tabular font-semibold text-[hsl(var(--pass))]">
                      −{tier.percent}%
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Tiers are estimated from the order in front of you and confirmed
                at invoicing against your total monthly volume — so your invoice
                may be lower than your estimate, never higher.
              </p>
            </Card>
          </RevealItem>

          <RevealItem>
            <Card className="h-full p-7">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-lava-50 text-lava-600 dark:bg-lava-950/45 dark:text-lava-400">
                <Zap className="size-5" aria-hidden />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                Expedited processing
              </h3>
              <p className="tabular mt-4 text-3xl font-semibold tracking-tight text-lava-600 dark:text-lava-400">
                +{EXPEDITE_SURCHARGE_PERCENT}%
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Moves your samples to the front of the analytical queue. Applied
                to the discounted subtotal. Note that expediting cannot shorten a
                fixed incubation — sterility still takes fourteen days.
              </p>
            </Card>
          </RevealItem>

          <RevealItem>
            <Card className="h-full p-7">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                <Info className="size-5" aria-hidden />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                Additional COA names
              </h3>
              <p className="tabular mt-4 text-3xl font-semibold tracking-tight">
                {formatCents(ADDITIONAL_COA_CENTS)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                per sample, per company
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Issues the same results under up to four additional company
                names. Never discounted, because each name is a separately signed
                and separately verifiable document.
              </p>
            </Card>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* ── Payment terms ──────────────────────────────────── */}
      <section className="container pb-20 sm:pb-28">
        <Reveal>
          <Card className="p-8 sm:p-11">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="overline mb-4">Payment</p>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  How billing works
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                  <p>
                    New clients are invoiced on completion, payable within
                    fourteen days. Established accounts submitting regularly can
                    request consolidated monthly invoicing, which is also where
                    volume tiers are applied against total monthly volume.
                  </p>
                  <p>
                    We do not require payment before analysis, and we do not hold
                    results pending payment. Your certificate is released when it
                    is ready.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/45 p-7">
                <p className="overline mb-5">What is never charged</p>
                <ul className="space-y-3.5 text-[15px]">
                  {[
                    "Account or platform fees",
                    "Minimum order value",
                    "Certificate issuance or verification",
                    "Vial photography",
                    "Chromatogram and spectrum copies",
                    "A different price for a failing result",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[hsl(var(--pass))]"
                        aria-hidden
                      />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/submit">
                  Build a Submission
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Request a formal quotation</Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
