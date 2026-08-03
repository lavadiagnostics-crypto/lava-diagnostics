"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { clientIp, recordAudit } from "@/lib/audit";
import { hashIp } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export interface AuthActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

/** bcrypt cost. 12 is a reasonable 2026 balance of security and latency. */
const BCRYPT_ROUNDS = 12;

export async function loginAction(
  raw: unknown,
  redirectTo?: string,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter your email address and password.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ipHash = hashIp(await clientIp());
  const limit = await rateLimit({
    key: `login:${ipHash ?? "anon"}`,
    ...RATE_LIMITS.login,
  });
  if (!limit.success) {
    return {
      ok: false,
      message: "Too many sign-in attempts. Please wait a few minutes.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: redirectTo || "/dashboard",
    });

    // `signIn` throws a redirect on success, so this is unreachable in practice.
    return { ok: true };
  } catch (error) {
    /*
     * Next's redirect mechanism is implemented as a thrown error, so a
     * successful sign-in surfaces here as NEXT_REDIRECT. It must be re-thrown
     * for the redirect to actually happen.
     */
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    if (error instanceof AuthError) {
      await recordAudit({
        action: "auth.login_failed",
        actorEmail: parsed.data.email,
        entity: "User",
        metadata: { reason: error.type },
      });

      // Deliberately identical for a wrong password and an unknown account.
      return {
        ok: false,
        message: "Those credentials are not correct.",
      };
    }

    console.error("[auth] unexpected sign-in failure", error);
    return {
      ok: false,
      message: "Sign-in is temporarily unavailable. Please try again shortly.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

/**
 * Client self-registration.
 *
 * Only ever creates CUSTOMER accounts - the role is hard-coded here and there is
 * no code path through which a request can ask for ADMIN. Admin accounts are
 * created by the seed script or promoted directly in the database.
 */
export async function registerAction(
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const ipHash = hashIp(await clientIp());
  const limit = await rateLimit({
    key: `register:${ipHash ?? "anon"}`,
    limit: 5,
    windowSeconds: 60 * 30,
  });
  if (!limit.success) {
    return {
      ok: false,
      message: "Too many sign-up attempts. Please wait a few minutes.",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      // Enumeration is already possible here by design - a registration form
      // must tell the user their address is taken. Point them at sign-in.
      return {
        ok: false,
        message:
          "An account already exists for this email address. Try signing in instead.",
        fieldErrors: { email: ["This email address is already registered."] },
      };
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.contactPerson,
          passwordHash,
          role: "CUSTOMER",
        },
        select: { id: true },
      });

      /*
       * Link to an existing Customer created by an earlier anonymous submission,
       * so a client's order history survives them creating an account later.
       * Only claims a record that is not already linked to another user.
       */
      const orphan = await tx.customer.findFirst({
        where: { email: data.email, userId: null },
        select: { id: true },
      });

      if (orphan) {
        await tx.customer.update({
          where: { id: orphan.id },
          data: {
            userId: user.id,
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            phone: data.phone,
          },
        });
      } else {
        await tx.customer.create({
          data: {
            userId: user.id,
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone,
          },
        });
      }
    });

    return {
      ok: true,
      message: "Account created. You can now sign in.",
    };
  } catch (error) {
    console.error("[auth] registration failed", error);
    return {
      ok: false,
      message: "We could not create your account. Please try again.",
    };
  }
}
