import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

/**
 * Crawler policy.
 *
 * Marketing pages are indexable. Everything touching a certificate, a client
 * portal or the admin area is disallowed outright, and `/verify` is disallowed
 * as a path prefix so that no certificate URL can ever be crawled — the
 * X-Robots-Tag headers in next.config.ts enforce the same thing for crawlers
 * that ignore robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  const base = appUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/services",
          "/pricing",
          "/knowledge-base",
          "/contact",
          "/legal",
        ],
        disallow: [
          "/verify",
          "/verify/",
          "/admin",
          "/dashboard",
          "/api/",
          "/login",
          "/register",
          "/submit/confirmation",
        ],
      },
      {
        // Explicitly deny the AI crawlers that respect robots.txt. Certificates
        // are confidential client records and should not be training data.
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "Google-Extended", "anthropic-ai"],
        disallow: ["/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
