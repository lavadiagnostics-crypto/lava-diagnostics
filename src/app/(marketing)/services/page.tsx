import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, FlaskConical, Layers, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { formatCents } from "@/lib/utils";
import { TEST_CATALOG } from "@/lib/pricing";
import { SERVICE_CARDS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Analytical Services",
  description:
    "RP-HPLC purity, LC-MS identity confirmation, quantitative net peptide content, USP sterility and endotoxin testing, ICP-MS elemental impurities and GC-HS residual solvents for research peptides.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />
        <div className="container relative py-20 sm:py-28">
          <Reveal className="max-w-3xl">
            <Badge variant="primary" size="lg" className="mb-7">
              <FlaskConical aria-hidden />
              Analytical Services
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-6xl">
              Every assay, and the question it answers
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Choose analyses per sample. Most release programmes pair purity with
              identity and net content; contamination panels are added where the
              application demands them.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/submit">
                  Build a Submission
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">Pricing & Turnaround</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Detailed assay list ────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <RevealGroup className="space-y-5">
          {TEST_CATALOG.map((test, index) => (
            <RevealItem key={test.key}>
              <Card className="overflow-hidden">
                <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tabular text-[13px] font-semibold text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {test.label}
                      </h2>
                      {test.requiresExtraVial ? (
                        <Badge variant="outline">
                          <TestTube aria-hidden />
                          Dedicated vial
                        </Badge>
                      ) : null}
                      {test.perVial ? (
                        <Badge variant="outline">
                          <Layers aria-hidden />
                          Billed per vial
                        </Badge>
                      ) : null}
                      {test.priceCents === 0 ? (
                        <Badge variant="pass">Included free</Badge>
                      ) : null}
                    </div>

                    <p className="mt-2 font-mono text-[13px] text-lava-600 dark:text-lava-400">
                      {test.method}
                    </p>
                    <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
                      {test.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-8 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
                    <div>
                      <p className="overline mb-1.5">Price</p>
                      <p className="tabular text-2xl font-semibold tracking-tight">
                        {test.priceCents === 0
                          ? "Free"
                          : formatCents(test.priceCents)}
                      </p>
                      {test.perVial ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          per vial
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          per sample
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="overline mb-1.5">Turnaround</p>
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        {test.turnaround}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ── Instrumentation ────────────────────────────────── */}
      <section className="border-y border-border bg-muted/35 py-20 sm:py-28">
        <div className="container">
          <Reveal className="max-w-3xl">
            <p className="overline mb-4">Instrumentation</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.1]">
              The platforms behind each result
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_CARDS.map((service) => (
              <RevealItem key={service.slug}>
                <Card className="flex h-full flex-col bg-background p-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-[13px] font-medium text-lava-600 dark:text-lava-400">
                    {service.subtitle}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <div className="mt-6 border-t border-border pt-5">
                    <div className="tabular text-lg font-semibold tracking-tight">
                      {service.metric}
                    </div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {service.metricLabel}
                    </div>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-12" delay={0.1}>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
              Detection limits and working ranges are method- and matrix-specific.
              The figures above describe typical performance under our validated
              conditions; your reported limits appear on your certificate.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Vial planning ──────────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <Reveal>
          <Card className="p-8 sm:p-11">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="overline mb-4">Planning your shipment</p>
                <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                  How many vials to send
                </h2>
                <p className="mt-5 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                  Chromatographic and spectrometric assays can share material from
                  a single vial. Sterility and bacterial endotoxin testing cannot —
                  each consumes a dedicated, unopened vial, because the question
                  they answer is destroyed by the first entry.
                </p>
                <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                  The submission form performs this arithmetic as you select
                  assays and states your total vial count before you confirm.
                  Sending too few vials is the most common cause of delay on an
                  otherwise complete order.
                </p>
                <Button variant="outline" className="mt-7" asChild>
                  <Link href="/knowledge-base/why-sterility-needs-its-own-vial">
                    Read the full explanation
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-muted/45 p-7">
                <p className="overline mb-5">Worked example</p>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">
                      Purity + Identity + Net Content
                    </span>
                    <span className="tabular shrink-0 font-semibold">1 vial</span>
                  </li>
                  <li className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">
                      + Bacterial Endotoxins
                    </span>
                    <span className="tabular shrink-0 font-semibold">+1 vial</span>
                  </li>
                  <li className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">+ Sterility</span>
                    <span className="tabular shrink-0 font-semibold">+1 vial</span>
                  </li>
                  <li className="flex items-start justify-between gap-4 border-t border-border pt-4 text-base">
                    <span className="font-semibold">Total to ship</span>
                    <span className="tabular shrink-0 font-semibold text-lava-600 dark:text-lava-400">
                      3 vials
                    </span>
                  </li>
                </ul>
                <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                  Vial conformity inspection is billed per vial and applies to
                  every vial you send, including the dedicated ones.
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
