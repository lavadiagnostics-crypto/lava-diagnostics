import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { ARTICLES } from "@/content/index";

/**
 * Sitemap.
 *
 * Marketing and knowledge-centre content only. No certificate, order, invoice
 * or portal URL appears here: a sitemap listing certificates would hand a
 * crawler exactly the enumerable index that the verification model exists to
 * prevent.
 *
 * Priorities are relative, not absolute. They say which pages matter most
 * within this site, which is the only thing the field has ever meant.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const now = new Date();

  const routes = [
    { url: `${base}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${base}/services`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${base}/pricing`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${base}/knowledge-base`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/about`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/submit`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/contact`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${base}/legal/terms`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${base}/legal/privacy`, priority: 0.3, changeFrequency: "yearly" },
    {
      url: `${base}/legal/research-use`,
      priority: 0.4,
      changeFrequency: "yearly",
    },
  ] as const satisfies readonly Omit<
    MetadataRoute.Sitemap[number],
    "lastModified"
  >[];

  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    ...route,
    lastModified: now,
  }));

  // Pillar guides outrank cluster articles, and each carries its own modified
  // date rather than a blanket build timestamp.
  const articles: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${base}/knowledge-base/${article.slug}`,
    lastModified: new Date(article.dateModified),
    changeFrequency: "monthly" as const,
    priority: article.isPillar ? 0.9 : 0.7,
  }));

  return [...staticRoutes, ...articles];
}
