import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      /** Null for admins, who are not tied to a Customer record. */
      customerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    customerId?: string | null;
  }
}

/**
 * Auth.js v5 resolves the JWT type from `@auth/core/jwt`, not `next-auth/jwt`.
 * Both are augmented so the callbacks in auth.config.ts see `role` and
 * `customerId` regardless of which module the installed version re-exports.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    customerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    customerId?: string | null;
  }
}
