import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = {
  title: "Client Login",
  robots: { index: false, follow: false },
};

/** Maps error codes passed by middleware or Auth.js into readable copy. */
const ERROR_MESSAGES: Record<string, string> = {
  forbidden:
    "That account does not have administrator access. Sign in with an administrator account to continue.",
  no_customer_profile:
    "This account is not linked to a client profile. Contact the laboratory and we will connect it.",
  CredentialsSignin: "Those credentials are not correct.",
  Configuration:
    "Sign-in is misconfigured on the server. Please contact the laboratory.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Already signed in - send them where they were trying to go.
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  /*
   * Only accept a same-site relative path as the post-login destination. An
   * absolute URL here would be an open redirect, letting an attacker use our
   * login page to bounce users to a phishing site.
   */
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <LoginForm
      redirectTo={safeNext}
      initialError={error ? (ERROR_MESSAGES[error] ?? undefined) : undefined}
    />
  );
}
