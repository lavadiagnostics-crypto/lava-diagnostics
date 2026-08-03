import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * `X-Robots-Tag: noindex` is deliberately global: nothing on this platform
 * should ever be indexed except the marketing pages, which opt back in
 * individually via their route metadata. Certificates in particular must
 * never appear in a search index.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Bundled certificate PDFs are read from the filesystem at request time, so
   * they must be traced into the serverless function. Next only traces files it
   * can see being imported, and these are opened by a runtime path — without
   * this the route would 404 in production while working locally.
   *
   * They live outside `public/` on purpose: a public path would make them
   * fetchable by URL, bypassing verification entirely.
   */
  outputFileTracingIncludes: {
    "/api/certificates/[id]/pdf": ["./src/content/coa/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Certificate verification results and the PDF stream must never be
        // cached by a shared cache or indexed by a crawler.
        source: "/verify/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/api/certificates/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
