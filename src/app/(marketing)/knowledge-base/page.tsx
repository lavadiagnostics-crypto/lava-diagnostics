import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { KNOWLEDGE_ARTICLES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description:
    "Technical guidance on interpreting Certificates of Analysis, the difference between purity and net peptide content, chromatogram reading, and submission best practice.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/knowledge-base" },
};

export default function KnowledgeBasePage() {
  const categories = Array.from(
    new Set(KNOWLEDGE_ARTICLES.map((a) => a.category)),
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />
        <div className="container relative py-20 sm:py-28">
          <Reveal className="max-w-3xl">
            <Badge variant="primary" size="lg" className="mb-7">
              <BookOpen aria-hidden />
              Knowledge Base
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-6xl">
              Understanding what your results mean
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Written by the analysts who run the assays. No marketing copy — just
              the technical background that makes a certificate useful rather than
              decorative.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container py-20 sm:py-28">
        {categories.map((category, categoryIndex) => (
          <div key={category} className={categoryIndex > 0 ? "mt-20" : ""}>
            <Reveal>
              <h2 className="text-xl font-semibold tracking-tight">
                {category}
              </h2>
              <div className="rule-fade mt-5" />
            </Reveal>

            <RevealGroup className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {KNOWLEDGE_ARTICLES.filter((a) => a.category === category).map(
                (article) => (
                  <RevealItem key={article.slug}>
                    <Link
                      href={`/knowledge-base/${article.slug}`}
                      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Card interactive className="flex h-full flex-col p-7">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3.5" aria-hidden />
                          {article.readingTime} read
                        </div>
                        <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-lava-600 dark:group-hover:text-lava-400">
                          {article.title}
                        </h3>
                        <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                          {article.excerpt}
                        </p>
                        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-lava-600 dark:text-lava-400">
                          Read article
                          <ArrowRight
                            className="size-4 transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </Card>
                    </Link>
                  </RevealItem>
                ),
              )}
            </RevealGroup>
          </div>
        ))}

        <Reveal className="mt-20">
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
        </Reveal>
      </section>
    </>
  );
}
