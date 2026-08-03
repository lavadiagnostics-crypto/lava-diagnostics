"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Menu, User, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-provider";
import { logoutAction } from "@/app/actions/auth";
import { cn, initials } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rendered as a count pill, e.g. unread messages. */
  badge?: number;
}

/**
 * Shared dashboard chrome for both the client portal and the admin area.
 *
 * The sidebar collapses to an overlay drawer below `lg`. Route changes close the
 * drawer, and body scroll is locked while it is open so the page behind does not
 * scroll under the user's finger.
 */
export function PortalShell({
  navItems,
  user,
  areaLabel,
  children,
}: {
  navItems: NavItem[];
  user: { name: string; email: string; role: string };
  /** Short label distinguishing the two areas, e.g. "Client Portal". */
  areaLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /**
   * Exact match for an index route, prefix match otherwise - so /dashboard does
   * not stay highlighted while you are on /dashboard/orders.
   */
  function isActive(href: string): boolean {
    const isIndex = href === "/dashboard" || href === "/admin";
    return isIndex ? pathname === href : pathname.startsWith(href);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label={areaLabel}>
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {active ? (
              <motion.span
                layoutId={`portal-nav-${areaLabel}`}
                className="absolute inset-0 -z-10 rounded-xl bg-muted"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}

            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active ? "text-lava-500" : "",
              )}
              aria-hidden
            />
            <span className="flex-1 truncate">{item.label}</span>

            {item.badge && item.badge > 0 ? (
              <Badge variant="primary" className="shrink-0 tabular">
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarBody = (
    <>
      <div className="px-2 pb-6">
        <Logo />
        <p className="mt-3 pl-0.5 text-[10px] font-semibold uppercase tracking-overline text-muted-foreground">
          {areaLabel}
        </p>
      </div>

      {nav}

      <div className="mt-6 border-t border-border pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lava-gradient text-[11px] font-semibold text-white">
                {initials(user.name || user.email)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  {user.name || "Account"}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {user.email}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>
              {user.role === "ADMIN" ? "Administrator" : "Client account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={user.role === "ADMIN" ? "/admin/settings" : "/dashboard/settings"}>
                <User />
                Account settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                void logoutAction();
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-muted/25">
      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <div className="lg:flex">
        {/* ── Desktop sidebar ── */}
        <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border bg-background px-3 py-6 lg:flex">
          {sidebarBody}
        </aside>

        {/* ── Mobile drawer ── */}
        {open ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-charcoal-950/50 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-border bg-background px-3 py-6 lg:hidden"
            >
              {sidebarBody}
            </motion.aside>
          </>
        ) : null}

        {/* ── Content ── */}
        <div className="min-w-0 flex-1">
          {/* Desktop utility bar */}
          <div className="sticky top-0 z-20 hidden h-16 items-center justify-end gap-2 border-b border-border bg-background/85 px-6 backdrop-blur-xl lg:flex">
            <ThemeToggle />
          </div>

          <main id="main" className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
