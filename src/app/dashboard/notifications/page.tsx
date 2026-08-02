import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Package, Receipt, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import { requireCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { markNotificationsRead } from "@/app/actions/notifications";
import { MarkReadOnMount } from "@/app/dashboard/notifications/mark-read";

export const metadata: Metadata = { title: "Notifications" };

const ICONS: Record<string, typeof Bell> = {
  package: Package,
  certificate: ShieldCheck,
  invoice: Receipt,
};

export default async function NotificationsPage() {
  const { customerId } = await requireCustomer("/dashboard/notifications");

  const notifications = await prisma.notification.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        overline="Client Portal"
        title="Notifications"
        description="Updates on your orders, certificates and invoices."
      />

      {/*
        Marks the visible notifications read from the client after paint, rather
        than as a side effect of rendering — a GET that mutates state would
        misbehave under prefetch and back-navigation.
      */}
      {unreadIds.length > 0 ? (
        <MarkReadOnMount
          ids={unreadIds}
          action={markNotificationsRead}
        />
      ) : null}

      {notifications.length === 0 ? (
        <EmptyState
          className="mt-9"
          icon={Bell}
          title="Nothing to report"
          description="When an order changes status or a certificate is released, you will see it here — and receive an email."
        />
      ) : (
        <ul className="mt-9 space-y-3">
          {notifications.map((notification) => {
            const Icon = ICONS[notification.icon ?? ""] ?? Bell;
            const unread = !notification.readAt;

            const body = (
              <Card
                className={cn(
                  "flex gap-4 p-5 transition-colors",
                  unread && "border-lava-200 bg-lava-50/40 dark:border-lava-900/70 dark:bg-lava-950/20",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    unread
                      ? "bg-lava-100 text-lava-600 dark:bg-lava-950/60 dark:text-lava-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-semibold tracking-tight">
                      {notification.title}
                    </p>
                    {unread ? (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-lava-500"
                        aria-label="Unread"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {relativeTime(notification.createdAt)}
                  </p>
                </div>
              </Card>
            );

            return (
              <li key={notification.id}>
                {notification.href ? (
                  <Link href={notification.href} className="block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
