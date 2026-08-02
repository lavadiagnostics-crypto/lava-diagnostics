import { auth } from "@/auth";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

/**
 * Public marketing shell.
 *
 * The session is read here purely to decide whether the header shows "Client
 * Login" or a link to the portal — no marketing content is gated.
 */
export default async function MarketingLayout({
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
