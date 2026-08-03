import { AUTHOR_BY_SLUG } from "@/content/authors";
import { PILLAR_ARTICLES } from "@/content/articles/pillars";
import { METHOD_ARTICLES } from "@/content/articles/methods";
import { CLUSTER_ARTICLES } from "@/content/articles/clusters";
import { CATEGORY_META, type Article, type ArticleCategory } from "@/content/types";

/**
 * The knowledge centre, assembled and validated.
 *
 * Validation runs at module load, which means an inconsistency fails the build
 * rather than shipping a broken page. Internal linking is the mechanism that
 * concentrates authority on the pillar pages, so a typo in a `related` slug is
 * not a cosmetic problem: it silently orphans a page.
 */

export const ARTICLES: Article[] = [
  ...PILLAR_ARTICLES,
  ...METHOD_ARTICLES,
  ...CLUSTER_ARTICLES,
];

function validate(articles: Article[]): void {
  const slugs = new Set<string>();
  const problems: string[] = [];

  for (const article of articles) {
    if (slugs.has(article.slug)) {
      problems.push(`Duplicate slug: ${article.slug}`);
    }
    slugs.add(article.slug);

    if (!AUTHOR_BY_SLUG[article.authorSlug]) {
      problems.push(`${article.slug}: unknown author ${article.authorSlug}`);
    }
    if (article.reviewerSlug && !AUTHOR_BY_SLUG[article.reviewerSlug]) {
      problems.push(`${article.slug}: unknown reviewer ${article.reviewerSlug}`);
    }
    // Meta title beyond ~60 characters is truncated in results, which wastes
    // the most valuable text on the page.
    if (article.metaTitle.length > 62) {
      problems.push(
        `${article.slug}: metaTitle is ${article.metaTitle.length} chars (max 62)`,
      );
    }
    if (
      article.metaDescription.length < 110 ||
      article.metaDescription.length > 165
    ) {
      problems.push(
        `${article.slug}: metaDescription is ${article.metaDescription.length} chars (want 110-165)`,
      );
    }
  }

  // Link targets are checked after every slug is known, so ordering in the
  // source files does not matter.
  for (const article of articles) {
    for (const slug of article.related) {
      if (!slugs.has(slug)) {
        problems.push(`${article.slug}: related slug not found: ${slug}`);
      }
    }
    if (article.pillar && !slugs.has(article.pillar)) {
      problems.push(`${article.slug}: pillar not found: ${article.pillar}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Knowledge centre content is invalid:\n  - ${problems.join("\n  - ")}`,
    );
  }
}

validate(ARTICLES);

export const ARTICLE_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLE_BY_SLUG[slug];
}

export function articlesByCategory(category: ArticleCategory): Article[] {
  return ARTICLES.filter((a) => a.category === category).sort((a, b) =>
    // Pillars first, then alphabetical, so a category page opens with its hub.
    a.isPillar === b.isPillar
      ? a.title.localeCompare(b.title)
      : a.isPillar
        ? -1
        : 1,
  );
}

export const PILLARS: Article[] = ARTICLES.filter((a) => a.isPillar);

/** Cluster members pointing at a given pillar. */
export function clusterFor(pillarSlug: string): Article[] {
  return ARTICLES.filter((a) => a.pillar === pillarSlug);
}

export function relatedArticles(article: Article): Article[] {
  return article.related
    .map((slug) => ARTICLE_BY_SLUG[slug])
    .filter((a): a is Article => Boolean(a));
}

export const CATEGORIES = Object.values(CATEGORY_META);

/** Word count, used for the Article schema and reading estimates. */
export function wordCount(article: Article): number {
  let words = 0;
  for (const block of article.blocks) {
    if (block.kind === "prose") {
      words += block.paragraphs.join(" ").split(/\s+/).length;
    } else if (block.kind === "answer") {
      words +=
        block.answer.split(/\s+/).length +
        block.paragraphs.join(" ").split(/\s+/).length;
    } else if (block.kind === "steps") {
      words += block.steps.map((s) => s.text).join(" ").split(/\s+/).length;
    } else if (block.kind === "callout") {
      words += block.body.split(/\s+/).length;
    } else if (block.kind === "definition") {
      words += (block.definition + " " + (block.expansion ?? "")).split(/\s+/)
        .length;
    }
  }
  words += article.faqs.map((f) => f.answer).join(" ").split(/\s+/).length;
  return words;
}

export { CATEGORY_META };
export type { Article, ArticleCategory };
