import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  QrCode,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal } from "@/components/shared/motion";
import { PILLARS } from "@/content/index";
import { FAQS, HOW_IT_WORKS, LAB_STATS, TESTIMONIALS } from "@/lib/constants";
import { TEST_CATALOG } from "@/lib/pricing";
import { formatCents } from "@/lib/utils";
import {
  buildGraph,
  faqSchema,
  organizationSchema,
  serviceSchema,
  websiteSchema,
} from "@/lib/seo/schema";
import { appUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Independent Third-Party Peptide Testing Services",
  description:
    "Independent third-party laboratory testing for research peptides. RP-HPLC purity, LC-MS identity, net peptide content, endotoxin and sterility, with verifiable certificates.",
  keywords: [
    "peptide testing services",
    "third party peptide testing",
    "independent peptide lab",
    "research peptide analysis",
    "peptide purity testing",
    "certificate of analysis verification",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Independent Third-Party Peptide Testing",
    description:
      "Purity, identity and contamination analysis for research peptides, issued as a certificate anyone can verify.",
    url: appUrl(),
    images: [
      {
        url: `${appUrl()}/api/og?title=${encodeURIComponent("Independent Third-Party Testing for Research Peptides")}&eyebrow=${encodeURIComponent("Analytical Laboratory")}`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

/** Two assays lead the services section; the rest are listed, not carded. */
const FEATURED = ["purity", "identity"] as const;

export default function HomePage() {
  const featured = TEST_CATALOG.filter((t) =>
    FEATURED.includes(t.key as (typeof FEATURED)[number]),
  );
  const remaining = TEST_CATALOG.filter(
    (t) => !FEATURED.includes(t.key as (typeof FEATURED)[number]),
  );

  return (
    <>
      <JsonLd
        data={buildGraph([
          organizationSchema(),
          websiteSchema(),
          ...TEST_CATALOG.slice(0, 6).map((t) =>
            serviceSchema({
              name: t.label,
              description: t.description,
              method: t.method,
              slug: t.key,
            }),
          ),
          faqSchema(FAQS, ""),
        ])}
      />

      {/* ── Hero. Asymmetric split, not centred. ─────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />

        <div className="container relative grid gap-14 pb-16 pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20 lg:pb-24 lg:pt-24">
          <Reveal>
            <Badge variant="primary" size="lg">
              <ShieldCheck aria-hidden />
              No peptides sold. Ever.
            </Badge>

            {/*
              Seven words, so the scale ramps rather than jumping straight to
              display size. text-6xl only arrives at lg, where there is width to
              hold it on two lines.
            */}
            <h1 className="mt-7 text-balance text-[2.15rem] font-semibold leading-[1.06] tracking-tightest md:text-5xl lg:text-[3.5rem]">
              Independent third-party testing for{" "}
              <span className="text-lava-600 dark:text-lava-400">
                research peptides
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Purity, identity and contamination analysis on qualified
              instrumentation, issued as a certificate anyone holding it can
              verify in seconds.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/submit">
                  Submit Samples
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/verify">
                  <ScanLine aria-hidden />
                  Verify a Certificate
                </Link>
              </Button>
            </div>
          </Reveal>

          {/*
            The specimen certificate is a real product artifact rendered from the
            same tokens as the live one, not a div dressed up as a screenshot.
          */}
          <Reveal delay={0.1} className="lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-3xl border border-border bg-card p-7 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-overline text-muted-foreground">
                      Certificate Number
                    </p>
                    <p className="mt-2.5 font-mono text-lg font-semibold tracking-tight">
                      LAVA-2026-000184
                    </p>
                  </div>
                  <Badge variant="pass">Pass</Badge>
                </div>

                <div className="mt-6 flex items-center justify-center rounded-2xl border border-border bg-muted/50 p-6">
                  <QrCode
                    className="size-24 text-foreground"
                    strokeWidth={1}
                    aria-hidden
                  />
                </div>

                <dl className="mt-6 space-y-3 text-[13px]">
                  {[
                    ["Purity, RP-HPLC", "99.12%"],
                    ["Identity, LC-MS", "2.1 ppm"],
                    ["Net content", "9.84 mg"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="tabular font-mono font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Specimen. This reference is illustrative and does not resolve
                  to a certificate.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats. Below the hero, not inside it. ────────────── */}
      <section className="border-b border-border">
        <dl className="container grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {LAB_STATS.map((stat) => (
            <div key={stat.label} className="bg-background px-5 py-8">
              <dd className="tabular text-3xl font-semibold tracking-tight sm:text-4xl">
                {stat.value}
              </dd>
              <dt className="mt-2 text-[13px] leading-snug text-muted-foreground">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Services. Two featured, the rest as a priced list. ─ */}
      <section className="container py-20 sm:py-28" id="services">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.08]">
            The instrumentation behind every certificate
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            Each assay answers a different question. Most release programmes
            pair purity with identity and net content, then add contamination
            panels where the application demands them.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {featured.map((test, i) => (
            <Reveal key={test.key} delay={i * 0.06}>
              <Card className="flex h-full flex-col justify-between p-8">
                <div>
                  <p className="font-mono text-[13px] text-lava-600 dark:text-lava-400">
                    {test.method}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    {test.label}
                  </h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    {test.description}
                  </p>
                </div>
                <div className="mt-8 flex items-baseline justify-between border-t border-border pt-6">
                  <span className="tabular text-xl font-semibold">
                    {formatCents(test.priceCents)}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {test.turnaround}
                  </span>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <ul className="mt-5 divide-y divide-border rounded-3xl border border-border">
          {remaining.map((test) => (
            <li
              key={test.key}
              className="flex flex-col gap-2 px-7 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
            >
              <div className="min-w-0">
                <h3 className="text-[17px] font-medium tracking-tight">
                  {test.label}
                </h3>
                <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                  {test.method}
                </p>
              </div>
              <div className="flex shrink-0 items-baseline gap-6">
                <span className="text-[13px] text-muted-foreground">
                  {test.turnaround}
                </span>
                <span className="tabular w-20 text-right font-semibold">
                  {test.priceCents === 0 ? "Free" : formatCents(test.priceCents)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Button variant="outline" size="lg" asChild>
            <Link href="/services">
              Full method specifications
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Process. Numbered rail, a different layout family. ─ */}
      <section className="border-y border-border bg-muted/30 py-20 sm:py-28">
        <div className="container">
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tightest sm:text-[2.6rem] sm:leading-[1.08]">
            From submission to independent verification
          </h2>

          <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className="border-t-2 border-lava-500 pt-5">
                <span className="tabular font-mono text-[13px] text-lava-600 dark:text-lava-400">
                  {String(item.step).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[17px] font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Verification. Full-bleed dark panel. ─────────────── */}
      <section className="container py-20 sm:py-28">
        <Card className="relative overflow-hidden border-charcoal-900 bg-charcoal-900 p-8 text-white sm:p-14 dark:border-border">
          <MoleculeBackground className="opacity-25" />
          <div className="relative max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.4rem] sm:leading-[1.1]">
              A certificate nobody can fake, and nobody can browse
            </h2>
            <p className="mt-5 text-pretty text-[17px] leading-relaxed text-white/70">
              Every certificate carries a unique number and a QR code. Scanning
              it returns that one certificate straight from our records, so an
              altered PDF gives itself away immediately.
            </p>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-white/55">
              There is no public directory of our certificates and no way to
              list them. A certificate can only be retrieved by someone who
              already holds its number or its QR code.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/verify">
                  <ScanLine aria-hidden />
                  Verify a Certificate
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/25 bg-transparent text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                <Link href="/knowledge-base/how-coa-verification-works">
                  How verification works
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Knowledge. Internal links into the pillar cluster. ─ */}
      <section className="border-t border-border bg-muted/30 py-20 sm:py-28">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tightest sm:text-[2.4rem] sm:leading-[1.1]">
              Understand what your results mean
            </h2>
            <Button variant="outline" asChild>
              <Link href="/knowledge-base">
                Knowledge base
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">
            {PILLARS.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge-base/${article.slug}`}
                className="group bg-background p-7 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[17px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-lava-600 dark:group-hover:text-lava-400">
                    {article.title}
                  </h3>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials. ───────────────────────────────────── */}
      <section className="container py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.author} className="flex flex-col">
              <blockquote className="flex-1 text-pretty text-[17px] leading-relaxed">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-5 text-[13px]">
                <span className="font-semibold">{testimonial.author}</span>
                <span className="block text-muted-foreground">
                  {testimonial.role}, {testimonial.company}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ. Matches the FAQPage node emitted above. ─────── */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.4rem] sm:leading-[1.1]">
              Questions we are asked before the first submission
            </h2>
            <Button variant="outline" className="mt-7" asChild>
              <Link href="/contact">
                Ask the laboratory
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Closing CTA. ────────────────────────────────────── */}
      <section className="container pb-10">
        <Card className="relative overflow-hidden bg-lava-gradient p-10 text-white sm:p-16">
          <div className="bg-blueprint absolute inset-0 opacity-20" />
          <div className="relative max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.5rem] sm:leading-[1.1]">
              Find out what is actually in the vial
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-white/85">
              Build your submission online, see an itemised estimate as you go,
              and receive an order number immediately.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="w-full bg-white text-charcoal-900 hover:bg-white/90 sm:w-auto dark:bg-white dark:text-charcoal-900"
              >
                <Link href="/submit">
                  Submit Samples
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full border-white/35 bg-transparent text-white hover:border-white/55 hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
