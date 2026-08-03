import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Eye,
  FileSearch,
  Microscope,
  Scale,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { BRAND, LAB_STATS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About the Laboratory",
  description:
    "LAVA Diagnostics is an independent analytical laboratory. We sell no peptides, take no commission from suppliers, and report every result exactly as measured.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    icon: Scale,
    title: "Structural independence",
    body: "We hold no ownership stake in, and receive no commission from, any manufacturer, distributor or reseller of research peptides. We do not sell peptides in any form. Our only commercial relationship with a client is the testing fee - and that fee is identical whether a sample passes or fails.",
  },
  {
    icon: Eye,
    title: "Results as measured",
    body: "A failing result is issued with the same rigour, and the same supporting data, as a passing one. We do not withdraw, soften or re-run a result because a client is unhappy with it, and we do not offer retesting until pass. What the instrument recorded is what the certificate says.",
  },
  {
    icon: ClipboardCheck,
    title: "Two-analyst review",
    body: "No certificate is released on one person's judgement. Every dataset is independently reviewed and signed off by a second analyst who did not run the sample, and the reviewing analyst is named on the document.",
  },
  {
    icon: FileSearch,
    title: "Evidence, not just conclusions",
    body: "Chromatograms and spectra are retained for every reported result and supplied on request. A purity percentage is a summary; the trace behind it is the evidence, and you are entitled to see it.",
  },
];

const METHODS = [
  {
    standard: "ICH Q2(R2)",
    scope: "Analytical method validation",
    detail:
      "Specificity, linearity, accuracy, precision, range and robustness established and documented for every quantitative method in routine use.",
  },
  {
    standard: "USP <71>",
    scope: "Sterility",
    detail:
      "Membrane filtration with 14-day incubation across two growth media, performed on intact unopened units under validated aseptic technique.",
  },
  {
    standard: "USP <85>",
    scope: "Bacterial endotoxins",
    detail:
      "Kinetic chromogenic LAL with positive product control demonstrating absence of assay inhibition or enhancement in your specific matrix.",
  },
  {
    standard: "USP <232>/<233>",
    scope: "Elemental impurities",
    detail:
      "ICP-MS determination of Class 1 and Class 2A elements with microwave digestion and matrix-matched calibration.",
  },
  {
    standard: "USP <467>",
    scope: "Residual solvents",
    detail:
      "Static headspace GC-FID screening for Class 1 and Class 2 solvents associated with peptide synthesis and purification.",
  },
  {
    standard: "USP <1225>",
    scope: "Compendial method verification",
    detail:
      "Verification that each compendial procedure performs as intended in our laboratory, on our instrumentation, with your sample matrix.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />
        <div className="container relative py-20 sm:py-28">
          <Reveal className="max-w-3xl">
            <Badge variant="primary" size="lg" className="mb-7">
              <Building2 aria-hidden />
              About the Laboratory
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-6xl">
              An analytical laboratory with nothing to sell you
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {BRAND.name} exists for one reason: so that a claim about a research
              peptide can be checked by a party with no stake in the answer.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Narrative ──────────────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
          <Reveal className="max-w-2xl">
            <p className="overline mb-5">Why we exist</p>
            <div className="space-y-6 text-[17px] leading-relaxed text-muted-foreground">
              <p>
                The research peptide market runs on documentation that is
                frequently produced by, or paid for by, the party selling the
                material. A certificate supplied by a vendor about the vendor&apos;s
                own product answers a different question than the one a buyer is
                actually asking.
              </p>
              <p>
                We built {BRAND.shortName} to remove that conflict entirely. We do
                not manufacture peptides. We do not distribute them, resell them,
                broker them, or take a referral fee from anyone who does. There is
                no arrangement under which a supplier can pay us more for a better
                number, because there is no better number - there is only what the
                instrument recorded.
              </p>
              <p>
                That constraint is commercially inconvenient and it is the entire
                point. When a batch comes back at 94% against a 99% label claim, we
                issue a certificate that says 94% and attach the chromatogram that
                shows why. Clients who want a laboratory that will find the answer
                they were hoping for are, genuinely, better served elsewhere.
              </p>
              <p>
                What we offer in return is a document that carries weight. A
                certificate is only worth the independence of the laboratory that
                signed it, and ours is verifiable by anyone your customers care to
                show it to.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="sticky top-24 p-8">
              <p className="overline mb-6">By the numbers</p>
              <dl className="space-y-6">
                {LAB_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-baseline justify-between gap-4 border-b border-border pb-5 last:border-0 last:pb-0"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {stat.label}
                    </dt>
                    <dd className="tabular text-2xl font-semibold tracking-tight">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <Button className="mt-8 w-full" asChild>
                <Link href="/submit">
                  Submit Samples
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── Principles ─────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/35 py-20 sm:py-28">
        <div className="container">
          <Reveal className="max-w-3xl">
            <p className="overline mb-4">Operating Principles</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.1]">
              Four commitments we will not trade away
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2">
            {PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <RevealItem key={principle.title}>
                  <Card className="h-full bg-background p-7">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-lava-50 text-lava-600 dark:bg-lava-950/45 dark:text-lava-400">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-6 text-lg font-semibold tracking-tight">
                      {principle.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {principle.body}
                    </p>
                  </Card>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* ── Methods & standards ────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <Reveal className="max-w-3xl">
          <p className="overline mb-4">Methods & Standards</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.1]">
            Where a compendial method exists, we follow it
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            Our methods are validated in accordance with ICH Q2(R2) and performed
            under a documented quality system. Contact the laboratory for our
            current accreditation schedule and scope documentation.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map((method) => (
            <RevealItem key={method.standard} className="bg-background p-7">
              <div className="flex items-center gap-2.5">
                <Microscope
                  className="size-4 shrink-0 text-lava-500"
                  aria-hidden
                />
                <span className="font-mono text-sm font-semibold tracking-tight">
                  {method.standard}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {method.scope}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {method.detail}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ── Scope limits ───────────────────────────────────── */}
      <section className="container pb-20 sm:pb-28">
        <Reveal>
          <Card className="border-lava-200 bg-lava-50/55 p-8 sm:p-11 dark:border-lava-900/70 dark:bg-lava-950/25">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lava-600 shadow-subtle dark:bg-charcoal-900 dark:text-lava-400">
                <Users className="size-5" aria-hidden />
              </span>
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  What we do not accept, and why we say so plainly
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                  <p>
                    We do not accept human growth hormone, HCG, HMG, testosterone
                    or related hormone preparations, nor cosmetic injectables of
                    unverified origin. Samples outside our accepted scope are
                    declined at receiving and returned at the client&apos;s cost.
                  </p>
                  <p>
                    We also do not issue statements about whether material is
                    safe, effective, or suitable for administration to any living
                    thing. An analytical result describes composition. It is not a
                    safety assessment, a regulatory clearance, or a licence, and we
                    will not let a certificate be presented as one.
                  </p>
                </div>
                <Button variant="outline" className="mt-7" asChild>
                  <Link href="/contact">
                    Discuss a submission
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
