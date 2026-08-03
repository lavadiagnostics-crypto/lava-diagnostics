import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Edge middleware guarding /admin and /dashboard.
 *
 * First line of defence only - the `authorized` callback in auth.config.ts
 * decides. Server actions and route handlers repeat the check independently.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /**
     * Everything except Next internals, static assets and the auth endpoints.
     * `/api/certificates/*` is excluded here because it runs its own
     * grant-based authorisation rather than session authentication.
     */
    "/((?!api/auth|api/certificates|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};
