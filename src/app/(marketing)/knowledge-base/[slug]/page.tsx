import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleBlock } from "@/components/knowledge/article-blocks";
import {
  ARTICLES,
  articleBySlug,
  relatedArticles,
  wordCount,
  CATEGORY_META,
} from "@/content/index";
import { AUTHOR_BY_SLUG } from "@/content/authors";
import {
  articleSchema,
  buildGraph,
  faqSchema,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo/schema";
import { appUrl } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return { title: "Article not found" };

  const ogUrl = `${appUrl()}/api/og?title=${encodeURIComponent(
    article.title,
  )}&eyebrow=${encodeURIComponent(
    CATEGORY_META[article.category].label,
  )}&meta=${encodeURIComponent(`${article.readingMinutes} min read`)}`;

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: `/knowledge-base/${article.slug}` },
    authors: [{ name: AUTHOR_BY_SLUG[article.authorSlug]?.name ?? "" }],
    openGraph: {
      type: "article",
      title: article.title,
      description: article.metaDescription,
      url: `${appUrl()}/knowledge-base/${article.slug}`,
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
      section: CATEGORY_META[article.category].label,
      tags: article.keywords,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [ogUrl],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const author = AUTHOR_BY_SLUG[article.authorSlug];
  const reviewer = article.reviewerSlug
    ? AUTHOR_BY_SLUG[article.reviewerSlug]
    : undefined;
  const category = CATEGORY_META[article.category];
  const related = relatedArticles(article);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Knowledge Base", path: "/knowledge-base" },
    { name: article.title, path: `/knowledge-base/${article.slug}` },
  ];

  return (
    <>
      {/*
        One connected graph rather than several loose nodes: the shared @id
        references let an engine resolve author, publisher and page to the same
        organisation without inferring it.
      */}
      <JsonLd
        data={buildGraph([
          organizationSchema(),
          websiteSchema(),
          articleSchema({
            headline: article.title,
            description: article.metaDescription,
            slug: article.slug,
            datePublished: article.datePublished,
            dateModified: article.dateModified,
            authorName: author?.name ?? "",
            authorRole: author?.role ?? "",
            reviewerName: reviewer?.name,
            wordCount: wordCount(article),
            section: category.label,
            keywords: article.keywords,
          }),
          faqSchema(article.faqs, `knowledge-base/${article.slug}`),
        ])}
      />

      <article className="container py-12 sm:py-16">
        <div className="mx-auto max-w-[46rem]">
          <Breadcrumbs crumbs={crumbs} className="mb-9" />

          <Link
            href={`/knowledge-base?category=${article.category}`}
            className="inline-block"
          >
            <Badge variant="primary">{category.label}</Badge>
          </Link>

          <h1 className="mt-6 text-balance text-[2.1rem] font-semibold leading-[1.12] tracking-tightest sm:text-[2.75rem]">
            {article.title}
          </h1>

          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>

          {/* Byline. The strongest single E-E-A-T signal on the page. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border py-5 text-[13px]">
            {author ? (
              <div>
                <span className="font-medium text-foreground">
                  {author.name}
                </span>
                <span className="text-muted-foreground">, {author.role}</span>
              </div>
            ) : null}
            {reviewer ? (
              <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                Reviewed by {reviewer.name}
              </div>
            ) : null}
            <div className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
              Updated {formatDate(article.dateModified)}
            </div>
            <div className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {article.readingMinutes} min read
            </div>
          </div>

          <div className="mt-12 space-y-12">
            {article.blocks.map((block, i) => (
              <ArticleBlock key={i} block={block} />
            ))}
          </div>

          {/* FAQ. Rendered as real content, matching the FAQPage node above. */}
          {article.faqs.length > 0 ? (
            <section className="mt-16">
              <h2 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
                Frequently asked questions
              </h2>
              <dl className="mt-8 space-y-8">
                {article.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-[17px] font-semibold leading-snug tracking-tight">
                      {faq.question}
                    </dt>
                    <dd className="mt-3 text-[16px] leading-[1.75] text-muted-foreground">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {author ? (
            <Card className="mt-16 bg-muted/40 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
                About the author
              </p>
              <p className="mt-4 text-[15px] font-semibold tracking-tight">
                {author.name}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {author.role} · {author.credentials}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {author.bio}
              </p>
            </Card>
          ) : null}

          <Separator className="my-14" />

          <Card className="p-7">
            <h2 className="text-xl font-semibold tracking-tight">
              Have a sample that needs characterising?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Build a submission online and see an itemised estimate as you
              select assays. Every result is reported exactly as measured.
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
        </div>

        {related.length > 0 ? (
          <div className="mx-auto mt-20 max-w-5xl">
            <h2 className="text-xl font-semibold tracking-tight">
              Related reading
            </h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {related.slice(0, 3).map((other) => (
                <Link
                  key={other.slug}
                  href={`/knowledge-base/${other.slug}`}
                  className="group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card interactive className="h-full p-6">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_META[other.category].label}
                    </p>
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
          </div>
        ) : null}
      </article>
    </>
  );
}
