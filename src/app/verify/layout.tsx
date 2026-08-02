import type { Metadata } from "next";
import { auth } from "@/auth";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

/**
 * Verification shell.
 *
 * `noindex` is asserted here in addition to the global default and the
 * X-Robots-Tag header set in next.config.ts. Three independent layers, because a
 * certificate leaking into a search index is not a recoverable mistake.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        isAuthenticated={Boolean(session?.user)}
        isAdmin={session?.user?.role === "ADMIN"}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
