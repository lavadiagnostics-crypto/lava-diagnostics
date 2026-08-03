import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe portion of the Auth.js configuration.
 *
 * Deliberately free of Prisma and bcrypt so it can run in the middleware
 * runtime. The Credentials provider - which needs both - is added in
 * `src/auth.ts`, which only ever runs in the Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 30,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    /**
     * Route authorisation. Runs in middleware for every matched request, so it
     * is the outermost gate on /admin and /dashboard.
     *
     * This is defence in depth, not the only check: every server action and
     * route handler independently re-verifies the session and role, because
     * middleware alone is not a sufficient authorisation boundary.
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const isLoggedIn = Boolean(auth?.user);

      if (pathname.startsWith("/admin")) {
        return role === "ADMIN";
      }
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }
      return true;
    },

    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.customerId = user.customerId ?? null;
        token.name = user.name ?? null;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name as string;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "CUSTOMER";
        session.user.customerId = token.customerId ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
