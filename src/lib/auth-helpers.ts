import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Authorisation helpers used by every server action, route handler and
 * protected page.
 *
 * Middleware is not treated as sufficient — a server action is reachable by
 * direct POST regardless of which page rendered it, so each one calls into here.
 */

export class AuthorizationError extends Error {
  constructor(message = "Not authorised.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Session or null. Never throws. */
export async function currentSession(): Promise<Session | null> {
  return auth();
}

/** Redirects unauthenticated visitors to login, preserving the intended path. */
export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect(
      returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login",
    );
  }
  return session;
}

/**
 * Admin gate.
 *
 * Re-reads the user row rather than trusting the JWT claim alone, so that
 * revoking an admin or deactivating an account takes effect immediately instead
 * of at the next token refresh.
 */
export async function requireAdmin(): Promise<{
  session: Session;
  userId: string;
  email: string;
}> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    redirect("/login?error=forbidden");
  }

  return { session, userId: user.id, email: user.email };
}

/**
 * Admin gate for contexts where redirecting is wrong (route handlers, actions
 * returning a result object). Throws instead of redirecting.
 */
export async function assertAdmin(): Promise<{
  userId: string;
  email: string;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthorizationError("Authentication required.");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    throw new AuthorizationError("Administrator privileges are required.");
  }
  return { userId: user.id, email: user.email };
}

/**
 * Resolves the Customer record owned by the signed-in user.
 *
 * Every customer-facing query must be scoped by the id this returns — it is the
 * tenancy boundary. Never accept a customerId from a request payload.
 */
export async function requireCustomer(returnTo?: string): Promise<{
  session: Session;
  customerId: string;
  companyName: string;
  email: string;
}> {
  const session = await requireSession(returnTo);

  const customer = await prisma.customer.findFirst({
    where: { userId: session.user.id },
    select: { id: true, companyName: true, email: true },
  });

  if (!customer) {
    // An admin with no customer profile landing on /dashboard, or an orphaned
    // user record. Send admins to their own area.
    if (session.user.role === "ADMIN") redirect("/admin");
    redirect("/login?error=no_customer_profile");
  }

  return {
    session,
    customerId: customer.id,
    companyName: customer.companyName,
    email: customer.email,
  };
}

/** Throwing variant of requireCustomer, for server actions. */
export async function assertCustomer(): Promise<{
  customerId: string;
  userId: string;
  email: string;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthorizationError("Authentication required.");

  const customer = await prisma.customer.findFirst({
    where: { userId: session.user.id },
    select: { id: true, email: true },
  });
  if (!customer) throw new AuthorizationError("No customer profile is linked to this account.");

  return {
    customerId: customer.id,
    userId: session.user.id,
    email: customer.email,
  };
}
