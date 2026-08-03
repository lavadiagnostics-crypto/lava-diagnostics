import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

/**
 * Crawler policy.
 *
 * Two audiences, two rules:
 *
 *  1. Search and answer engines (Google, Bing, ChatGPT, Perplexity, Claude,
 *     Gemini) are ALLOWED on the marketing site and the knowledge centre. Those
 *     pages exist to be found and cited. Blocking an AI crawler does not protect
 *     anything here, it just removes this laboratory from the answer when
 *     somebody asks an assistant who independently tests research peptides.
 *
 *  2. Everything touching a certificate, a client portal or the admin area is
 *     disallowed for every crawler without exception. That is where the
 *     confidential material lives, and the X-Robots-Tag headers in
 *     next.config.ts enforce the same boundary for crawlers that ignore this
 *     file.
 *
 * The distinction matters: an earlier revision blocked GPTBot, ClaudeBot,
 * PerplexityBot and Google-Extended outright. That protected nothing (the
 * private routes were already disallowed) while making the laboratory invisible
 * to exactly the assistants clients now use to shortlist testing providers.
 */

/** Routes that must never be crawled, by anyone. */
const PRIVATE_ROUTES = [
  "/verify",
  "/verify/",
  "/admin",
  "/dashboard",
  "/api/",
  "/login",
  "/register",
  "/submit/confirmation",
];

/**
 * Answer-engine crawlers we explicitly welcome on public content.
 *
 * Naming them individually rather than relying on the `*` rule is deliberate:
 * several of these only honour a directive addressed to their own user-agent,
 * and an explicit Allow makes the intent auditable.
 */
const ANSWER_ENGINE_BOTS = [
  "GPTBot", // ChatGPT browsing and training
  "OAI-SearchBot", // ChatGPT Search
  "ChatGPT-User", // ChatGPT on-demand fetch
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended", // Gemini grounding
  "Applebot-Extended",
  "meta-externalagent",
  "Bingbot",
  "DuckDuckBot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  const base = appUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROUTES,
      },
      {
        userAgent: ANSWER_ENGINE_BOTS,
        allow: [
          "/",
          "/about",
          "/services",
          "/pricing",
          "/knowledge-base",
          "/knowledge-base/",
          "/contact",
          "/legal",
        ],
        disallow: PRIVATE_ROUTES,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
