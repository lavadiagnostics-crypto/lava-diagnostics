import type { Metadata } from "next";
import { ScrollText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit Log" };

/** Actions that change who can see a certificate get visual emphasis. */
const DISCLOSURE_ACTIONS = new Set([
  "certificate.released",
  "certificate.made_private",
  "certificate.revoked",
  "certificate.deleted",
]);

function actionLabel(action: string): string {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ");
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam } = await searchParams;

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 60;

  const [entries, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        actorEmail: true,
        entity: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.activityLog.count(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        overline="Administration"
        title="Audit log"
        description="An append-only record of every privileged action. Entries are never edited or deleted."
      />

      <Card className="mt-8 border-lava-200 bg-lava-50/45 p-5 dark:border-lava-900/70 dark:bg-lava-950/20">
        <div className="flex gap-3.5">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-lava-600 dark:text-lava-400"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed">
            Actions that change who can see a certificate are highlighted. IP
            addresses are stored only as keyed one-way hashes, so this log
            attributes actions to accounts rather than to network locations.
          </p>
        </div>
      </Card>

      {entries.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={ScrollText}
          title="No activity recorded"
          description="Privileged actions will be logged here as they happen."
        />
      ) : (
        <>
          <Card className="mt-8 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/45 hover:bg-muted/45">
                  <TableHead className="pl-6">When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="pr-6">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const disclosure = DISCLOSURE_ACTIONS.has(entry.action);
                  const metadata =
                    entry.metadata && typeof entry.metadata === "object"
                      ? (entry.metadata as Record<string, unknown>)
                      : null;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap pl-6 text-[13px] text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={disclosure ? "primary" : "muted"}>
                          {actionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[190px]">
                        <p className="truncate text-[13px]">
                          {entry.user?.email ?? entry.actorEmail ?? "system"}
                        </p>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {entry.entity ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[280px] pr-6">
                        {metadata ? (
                          <p className="truncate font-mono text-[11px] text-muted-foreground">
                            {Object.entries(metadata)
                              .slice(0, 3)
                              .map(([key, value]) => `${key}=${String(value)}`)
                              .join(" · ")}
                          </p>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Showing {entries.length} of {total} entries
          </p>
        </>
      )}
    </div>
  );
}
