"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-provider";
import { MAIN_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Marketing site header.
 *
 * Becomes a frosted bar once the page is scrolled. The mobile sheet locks body
 * scroll while open and closes on route change so a back-navigation never
 * leaves it stranded.
 */
export function SiteHeader({
  isAuthenticated,
  isAdmin,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const portalHref = isAdmin ? "/admin" : "/dashboard";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-3 z-50 rounded-full bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
      >
        Skip to content
      </a>

      <div className="container flex h-[70px] items-center justify-between gap-4">
        <Logo />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {MAIN_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-muted"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/verify">
                <ShieldCheck className="size-4" />
                Verify COA
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={portalHref}>
                  <LayoutDashboard className="size-4" />
                  {isAdmin ? "Admin" : "Portal"}
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Client Login</Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/submit">Submit Samples</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-5" aria-label="Mobile navigation">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-4">
                <Button variant="outline" asChild>
                  <Link href="/verify">
                    <ShieldCheck className="size-4" />
                    Verify a Certificate
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={isAuthenticated ? portalHref : "/login"}>
                    <LayoutDashboard className="size-4" />
                    {isAuthenticated
                      ? isAdmin
                        ? "Admin Dashboard"
                        : "Client Portal"
                      : "Client Login"}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/submit">Submit Samples</Link>
                </Button>
                <div className="flex items-center justify-between px-2 pt-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
