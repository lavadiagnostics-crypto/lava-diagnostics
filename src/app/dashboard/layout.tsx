import type { Metadata } from "next";
import {
  Bell,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/shared/portal-shell";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s · LAVA Portal" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Client portal shell.
 *
 * `requireCustomer` both authenticates and resolves the tenancy boundary. Every
 * page below scopes its queries by the customerId it returns — never by an id
 * taken from the URL or a form.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, customerId, companyName } =
    await requireCustomer("/dashboard");

  const unreadNotifications = await prisma.notification.count({
    where: { customerId, readAt: null },
  });

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Orders", icon: Package },
    { href: "/dashboard/certificates", label: "Certificates", icon: ShieldCheck },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotifications,
    },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <PortalShell
      navItems={navItems}
      areaLabel="Client Portal"
      user={{
        name: session.user.name || companyName,
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </PortalShell>
  );
}
