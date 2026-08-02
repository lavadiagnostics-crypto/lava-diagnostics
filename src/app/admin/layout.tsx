import type { Metadata } from "next";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/shared/portal-shell";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · LAVA Admin" },
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

/**
 * Admin shell.
 *
 * `requireAdmin` re-reads the user row rather than trusting the JWT claim, so
 * revoking an administrator takes effect on their next request rather than at
 * the next token refresh. Middleware has already checked the claim; this is the
 * authoritative check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await requireAdmin();

  const [pendingOrders, unreadMessages] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.message.count({ where: { status: "UNREAD" } }),
  ]);

  const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: ClipboardList,
      badge: pendingOrders,
    },
    { href: "/admin/certificates", label: "COA Library", icon: ShieldCheck },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/invoices", label: "Invoices", icon: Receipt },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    {
      href: "/admin/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessages,
    },
    { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <PortalShell
      navItems={navItems}
      areaLabel="Administration"
      user={{
        name: session.user.name || "Administrator",
        email: session.user.email ?? "",
        role: "ADMIN",
      }}
    >
      {children}
    </PortalShell>
  );
}
