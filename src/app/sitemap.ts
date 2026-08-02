import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { KNOWLEDGE_ARTICLES } from "@/lib/constants";

/**
 * Sitemap.
 *
 * Lists marketing content only. No certificate, order, invoice or portal URL
 * appears here — a sitemap listing certificates would defeat the entire
 * verification-only access model.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const now = new Date();

  // `satisfies` keeps each `changeFrequency` as its literal type rather than
  // widening the array's element type to `string`.
  const routes = [
    { url: `${base}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${base}/services`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${base}/pricing`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${base}/about`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/knowledge-base`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${base}/contact`, priority: 0.7, changeFrequency: "yearly" },
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

  const articles: MetadataRoute.Sitemap = KNOWLEDGE_ARTICLES.map((article) => ({
    url: `${base}/knowledge-base/${article.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articles];
}
