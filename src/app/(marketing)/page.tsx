import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  FlaskConical,
  Inbox,
  QrCode,
  Quote,
  ScanLine,
  ShieldCheck,
  Sparkles,
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
import {
  AuroraBackground,
  MoleculeBackground,
} from "@/components/shared/molecule-background";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import {
  FAQS,
  HOW_IT_WORKS,
  LAB_STATS,
  SERVICE_CARDS,
  TESTIMONIALS,
} from "@/lib/constants";

/** The home page is one of the few routes that should be indexed. */
export const metadata: Metadata = {
  title: "Independent Third-Party Testing for Research Peptides",
  description:
    "LAVA Diagnostics is an independent analytical laboratory providing RP-HPLC purity, LC-MS identity, ICP-MS elemental impurity, sterility and endotoxin testing for research peptides — with certificates anyone can verify.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

const STEP_ICONS = [FileCheck2, Inbox, FlaskConical, ShieldCheck, QrCode];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <AuroraBackground />
        <MoleculeBackground className="opacity-[0.55] dark:opacity-40" />
        <div className="bg-blueprint absolute inset-0 opacity-[0.32] [mask-image:radial-gradient(ellipse_65%_50%_at_50%_0%,black,transparent)]" />

        <div className="container relative pb-24 pt-20 sm:pb-32 sm:pt-28">
          <Reveal className="mx-auto max-w-4xl text-center">
            <Badge variant="primary" size="lg" className="mb-8">
              <Sparkles aria-hidden />
              No peptides sold. Ever.
            </Badge>

            <h1 className="text-balance text-[2.6rem] font-semibold leading-[1.06] tracking-tightest sm:text-6xl lg:text-[4.4rem]">
              Independent Third-Party Testing for{" "}
              <span className="text-gradient-lava">Research Peptides</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Purity, identity and contamination analysis performed on qualified
              instrumentation under documented methods — issued as a Certificate
              of Analysis that anyone holding it can verify in seconds.
            </p>

            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                  Verify COA
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Standard turnaround 3–5 business days · Results reported exactly as
              measured
            </p>
          </Reveal>

          {/* Statistics strip */}
          <RevealGroup className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:mt-24 lg:grid-cols-4">
            {LAB_STATS.map((stat) => (
              <RevealItem
                key={stat.label}
                className="bg-background px-6 py-8 text-center"
              >
                <div className="tabular text-3xl font-semibold tracking-tight sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-[13px] leading-snug text-muted-foreground">
                  {stat.label}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────── */}
      <section className="container py-24 sm:py-32" id="services">
        <Reveal className="max-w-3xl">
          <p className="overline mb-4">Analytical Capability</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.7rem] sm:leading-[1.1]">
            The instrumentation behind every certificate
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            Each assay answers a different question about your material. Most
            release programmes combine purity, identity and net content; add
            contamination panels where your application demands them.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CARDS.map((service) => (
            <RevealItem key={service.slug}>
              <Card
                interactive
                className="group flex h-full flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {service.title}
                    </h3>
                    <span className="mt-0.5 size-2 shrink-0 rounded-full bg-lava-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-lava-600 dark:text-lava-400">
                    {service.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                </div>

                <div className="mt-7 flex items-end justify-between border-t border-border pt-5">
                  <div>
                    <div className="tabular text-xl font-semibold tracking-tight">
                      {service.metric}
                    </div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {service.metricLabel}
                    </div>
                  </div>
                </div>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 flex justify-center" delay={0.1}>
          <Button variant="outline" size="lg" asChild>
            <Link href="/services">
              Full method specifications
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Reveal>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border bg-muted/35 py-24 sm:py-32">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="overline mb-4">Process</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.7rem] sm:leading-[1.1]">
              From submission to independent verification
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
              Five steps, full chain of custody, and a certificate your own
              customers can check without taking your word for it.
            </p>
          </Reveal>

          <ol className="mt-16 grid gap-6 lg:grid-cols-5">
            {HOW_IT_WORKS.map((item, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <Reveal key={item.step} delay={index * 0.09} className="h-full">
                  <li className="relative flex h-full flex-col rounded-3xl border border-border bg-background p-6">
                    {/* Connector, drawn only between cards on wide screens. */}
                    {index < HOW_IT_WORKS.length - 1 ? (
                      <span
                        className="absolute -right-[13px] top-[46px] z-10 hidden h-px w-[26px] bg-border lg:block"
                        aria-hidden
                      />
                    ) : null}

                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lava-50 text-lava-600 dark:bg-lava-950/45 dark:text-lava-400">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="tabular text-[13px] font-semibold text-muted-foreground">
                        Step {item.step}
                      </span>
                    </div>

                    <h3 className="mt-5 text-base font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── Verification callout ───────────────────────────── */}
      <section className="container py-24 sm:py-32">
        <Reveal>
          <Card className="relative overflow-hidden border-charcoal-900 bg-charcoal-900 p-8 text-white sm:p-14 dark:border-border">
            <MoleculeBackground className="opacity-25" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
              <div>
                <Badge
                  variant="outline"
                  size="lg"
                  className="mb-6 border-white/25 text-white/80"
                >
                  <ShieldCheck aria-hidden />
                  Certificate Verification
                </Badge>
                <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.4rem] sm:leading-[1.12]">
                  A certificate nobody can fake, and nobody can browse
                </h2>
                <p className="mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-white/70">
                  Every certificate we issue carries a unique number and a QR
                  code. Scanning it returns that one certificate, straight from
                  our records — so an altered PDF gives itself away immediately.
                </p>
                <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
                  There is no public directory of our certificates and no way to
                  list them. A certificate can only be retrieved by someone who
                  already holds its number or its QR code.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button variant="default" size="lg" asChild>
                    <Link href="/verify">
                      <ScanLine aria-hidden />
                      Verify a Certificate
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="border-white/25 bg-transparent text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/knowledge-base/verifying-a-certificate-is-genuine">
                      How verification works
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Sample certificate reference, styled as a specimen. */}
              <div className="relative mx-auto w-full max-w-xs">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-md">
                  <p className="text-[10px] font-semibold uppercase tracking-overline text-white/45">
                    Certificate Number
                  </p>
                  <p className="mt-3 font-mono text-xl font-semibold tracking-tight">
                    LAVA-2026-000184
                  </p>
                  <div className="mt-6 flex items-center justify-center rounded-2xl bg-white p-5">
                    <QrCode
                      className="size-24 text-charcoal-900"
                      strokeWidth={1.1}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-5 text-center text-xs leading-relaxed text-white/50">
                    Specimen only. This reference is illustrative and does not
                    resolve to a certificate.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ── Testimonials ───────────────────────────────────── */}
      <section className="border-y border-border bg-muted/35 py-24 sm:py-32">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="overline mb-4">Client Confidence</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.7rem] sm:leading-[1.1]">
              Trusted where the result matters more than the answer
            </h2>
          </Reveal>

          <RevealGroup className="mt-16 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <RevealItem key={testimonial.author}>
                <figure className="flex h-full flex-col rounded-3xl border border-border bg-background p-7">
                  <Quote
                    className="size-7 shrink-0 text-lava-500/40"
                    aria-hidden
                  />
                  <blockquote className="mt-5 flex-1 text-pretty text-[15px] leading-relaxed text-foreground/90">
                    {testimonial.quote}
                  </blockquote>
                  <figcaption className="mt-7 border-t border-border pt-5">
                    <div className="text-sm font-semibold">
                      {testimonial.author}
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </figcaption>
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="container py-24 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="overline mb-4">Frequently Asked</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.5rem] sm:leading-[1.1]">
              Questions we are asked before the first submission
            </h2>
            <p className="mt-5 text-pretty text-[15px] leading-relaxed text-muted-foreground">
              If your question is not here, our laboratory team answers technical
              enquiries directly — usually within one business day.
            </p>
            <Button variant="outline" className="mt-7" asChild>
              <Link href="/contact">
                Ask the laboratory
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={0.08}>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="container pb-8">
        <Reveal>
          <Card className="relative overflow-hidden bg-lava-gradient p-10 text-center text-white sm:p-16">
            <div className="bg-blueprint absolute inset-0 opacity-20" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tightest sm:text-[2.5rem] sm:leading-[1.12]">
                Find out what is actually in the vial
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-white/85">
                Build your submission online, see an itemised estimate as you go,
                and receive an order number immediately. No account required to
                start.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="w-full bg-white text-charcoal-900 hover:bg-white/90 sm:w-auto dark:bg-white dark:text-charcoal-900"
                >
                  <Link href="/submit">
                    Start a Submission
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
        </Reveal>
      </section>
    </>
  );
}
