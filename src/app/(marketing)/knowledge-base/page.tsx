import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/shared/motion";
import {
  ARTICLES,
  CATEGORIES,
  PILLARS,
  articlesByCategory,
  CATEGORY_META,
} from "@/content/index";
import {
  buildGraph,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo/schema";
import { appUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Peptide Testing Knowledge Base",
  description:
    "Technical guidance on peptide testing: interpreting a Certificate of Analysis, RP-HPLC and LC-MS methods, endotoxin and sterility testing, and COA verification.",
  keywords: [
    "peptide testing guide",
    "certificate of analysis guide",
    "peptide analysis knowledge base",
    "research peptide testing",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/knowledge-base" },
  openGraph: {
    title: "Peptide Testing Knowledge Base",
    description:
      "Technical guidance on peptide testing, written by the analysts who run the assays.",
    url: `${appUrl()}/knowledge-base`,
    images: [
      {
        url: `${appUrl()}/api/og?title=${encodeURIComponent("Peptide Testing Knowledge Base")}&eyebrow=${encodeURIComponent("Knowledge Base")}`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function KnowledgeBasePage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Knowledge Base", path: "/knowledge-base" },
  ];

  return (
    <>
      <JsonLd data={buildGraph([organizationSchema(), websiteSchema()])} />

      {/*
        Asymmetric header rather than a centred hero. The index of a reference
        library should read as a library, not as a landing page.
      */}
      <section className="border-b border-border">
        <div className="container py-14 sm:py-20">
          <Breadcrumbs crumbs={crumbs} className="mb-9" />
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div>
              <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-5xl">
                Peptide testing, explained by the people who run the assays
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                No marketing copy. The technical background that makes a
                certificate useful rather than decorative.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              <div className="bg-background px-4 py-5">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Articles
                </dt>
                <dd className="tabular mt-1 text-2xl font-semibold">
                  {ARTICLES.length}
                </dd>
              </div>
              <div className="bg-background px-4 py-5">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Guides
                </dt>
                <dd className="tabular mt-1 text-2xl font-semibold">
                  {PILLARS.length}
                </dd>
              </div>
              <div className="bg-background px-4 py-5">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Topics
                </dt>
                <dd className="tabular mt-1 text-2xl font-semibold">
                  {CATEGORIES.length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Pillar guides get a heavier treatment than the cluster pages below. */}
      <section className="container py-14 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight">
          Start with a complete guide
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PILLARS.map((article, index) => (
            <Reveal key={article.slug} delay={index * 0.05}>
              <Link
                href={`/knowledge-base/${article.slug}`}
                className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card
                  interactive
                  className="flex h-full flex-col border-2 p-7 hover:border-lava-400 dark:hover:border-lava-800"
                >
                  <Badge variant="primary" className="self-start">
                    {CATEGORY_META[article.category].label}
                  </Badge>
                  <h3 className="mt-5 text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-lava-600 dark:group-hover:text-lava-400">
                    {article.title}
                  </h3>
                  <p className="mt-3 flex-1 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-lava-600 dark:text-lava-400">
                    Read the guide
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/*
        Cluster pages as divided rows rather than another card grid, so the two
        levels of the library are visually distinct.
      */}
      <section className="border-t border-border bg-muted/30 py-14 sm:py-20">
        <div className="container space-y-14">
          {CATEGORIES.map((category) => {
            const articles = articlesByCategory(category.slug).filter(
              (a) => !a.isPillar,
            );
            if (articles.length === 0) return null;

            return (
              <div key={category.slug}>
                <div className="max-w-2xl">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {category.label}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                </div>

                <ul className="mt-7 divide-y divide-border border-t border-border">
                  {articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/knowledge-base/${article.slug}`}
                        className="group flex flex-col gap-2 py-5 transition-opacity hover:opacity-70 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                      >
                        <div className="min-w-0">
                          <h3 className="text-[17px] font-medium leading-snug tracking-tight">
                            {article.title}
                          </h3>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                            {article.excerpt}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                          <Clock className="size-3.5" aria-hidden />
                          {article.readingMinutes} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container py-14 sm:py-20">
        <Card className="p-8 text-center sm:p-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight">
            Question not covered here?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
            Technical enquiries are answered by an analyst rather than a support
            queue, usually within one business day.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/contact">
              Ask the laboratory
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Card>
      </section>
    </>
  );
}
