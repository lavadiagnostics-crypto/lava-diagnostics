import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/motion";
import { KNOWLEDGE_ARTICLES } from "@/lib/constants";

/** Statically render every article at build time. */
export function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((article) => ({ slug: article.slug }));
}

function findArticle(slug: string) {
  return KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) return { title: "Article not found" };

  return {
    title: article.title,
    description: article.excerpt,
    robots: { index: true, follow: true },
    alternates: { canonical: `/knowledge-base/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const others = KNOWLEDGE_ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <article className="container py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl">
        <Link
          href="/knowledge-base"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Knowledge Base
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge variant="primary">{article.category}</Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            {article.readingTime} read
          </span>
        </div>

        <h1 className="mt-6 text-balance text-3xl font-semibold leading-[1.14] tracking-tightest sm:text-[2.75rem]">
          {article.title}
        </h1>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="rule-fade my-12" />

        {/* Body sections. Content is authored in constants.ts, not user input. */}
        <div className="space-y-12">
          {article.body.map((section) => (
            <section key={section.heading}>
              <h2 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                {section.heading}
              </h2>
              <div className="mt-5 space-y-5">
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-pretty text-[17px] leading-[1.72] text-foreground/85"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="rule-fade my-14" />

        <Card className="bg-muted/45 p-7">
          <h2 className="text-lg font-semibold tracking-tight">
            Have a sample you need characterised?
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
            Build a submission online and see an itemised estimate as you select
            assays.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/submit">
                Submit Samples
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/verify">Verify a Certificate</Link>
            </Button>
          </div>
        </Card>
      </Reveal>

      {others.length > 0 ? (
        <Reveal className="mx-auto mt-20 max-w-5xl" delay={0.08}>
          <h2 className="text-lg font-semibold tracking-tight">
            Related reading
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {others.map((other) => (
              <Link
                key={other.slug}
                href={`/knowledge-base/${other.slug}`}
                className="group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card interactive className="h-full p-6">
                  <p className="overline">{other.category}</p>
                  <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight transition-colors group-hover:text-lava-600 dark:group-hover:text-lava-400">
                    {other.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {other.excerpt}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}
    </article>
  );
}
