"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Building2, Mail, Phone, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { Textarea } from "@/components/ui/textarea";
import { replyToMessage, setMessageStatus } from "@/app/actions/admin-messages";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";
import type { MessageStatus } from "@prisma/client";

export interface AdminMessage {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  subject: string;
  body: string;
  status: MessageStatus;
  replyBody: string | null;
  repliedAt: Date | null;
  repliedBy: string | null;
  createdAt: Date;
  customerId: string | null;
}

const STATUS_VARIANT: Record<
  MessageStatus,
  "default" | "primary" | "outline" | "muted" | "pass" | "pending"
> = {
  UNREAD: "pending",
  READ: "muted",
  REPLIED: "pass",
  ARCHIVED: "outline",
};

export function MessageList({ messages }: { messages: AdminMessage[] }) {
  const router = useRouter();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);

  /** Opening an unread enquiry marks it read, so the badge stays truthful. */
  function toggle(message: AdminMessage) {
    const next = openId === message.id ? null : message.id;
    setOpenId(next);
    setReply("");

    if (next && message.status === "UNREAD") {
      void setMessageStatus(message.id, "READ").then(() => router.refresh());
    }
  }

  async function send(messageId: string) {
    setPending(messageId);
    try {
      const result = await replyToMessage({ messageId, replyBody: reply });
      if (!result.ok) {
        toast.error(result.message ?? "Could not send the reply.");
        return;
      }
      toast.success("Reply sent.");
      setReply("");
      setOpenId(null);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function archive(messageId: string) {
    setPending(messageId);
    try {
      const result = await setMessageStatus(messageId, "ARCHIVED");
      if (!result.ok) {
        toast.error(result.message ?? "Could not archive.");
        return;
      }
      toast.success("Archived.");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => {
        const open = openId === message.id;

        return (
          <li key={message.id}>
            <Card
              className={cn(
                "overflow-hidden transition-colors",
                message.status === "UNREAD" &&
                  "border-lava-200 dark:border-lava-900/70",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(message)}
                className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-muted/35"
                aria-expanded={open}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="text-[15px] font-semibold tracking-tight">
                      {message.subject}
                    </p>
                    <Badge variant={STATUS_VARIANT[message.status]}>
                      {message.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
                    {message.name}
                    {message.company ? ` · ${message.company}` : ""} ·{" "}
                    {relativeTime(message.createdAt)}
                  </p>
                  {!open ? (
                    <p className="mt-2 line-clamp-1 text-[13px] text-muted-foreground/85">
                      {message.body}
                    </p>
                  ) : null}
                </div>
              </button>

              {open ? (
                <div className="border-t border-border px-5 pb-5 pt-5">
                  {/* ── Contact ── */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                    <a
                      href={`mailto:${message.email}`}
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="size-3.5" aria-hidden />
                      {message.email}
                    </a>
                    {message.phone ? (
                      <a
                        href={`tel:${message.phone.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        {message.phone}
                      </a>
                    ) : null}
                    {message.company ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="size-3.5" aria-hidden />
                        {message.company}
                      </span>
                    ) : null}
                  </div>

                  <Separator className="my-5" />

                  {/* ── Enquiry ── */}
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {message.body}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Received {formatDateTime(message.createdAt)}
                  </p>

                  {/* ── Previous reply ── */}
                  {message.replyBody ? (
                    <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="overline mb-2">
                        Replied by {message.repliedBy}
                      </p>
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                        {message.replyBody}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {formatDateTime(message.repliedAt)}
                      </p>
                    </div>
                  ) : null}

                  {/* ── Reply form ── */}
                  {message.status !== "ARCHIVED" ? (
                    <div className="mt-6">
                      <Textarea
                        rows={4}
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        placeholder={
                          message.replyBody
                            ? "Send a follow-up reply…"
                            : "Write your reply. It is emailed to the enquirer directly."
                        }
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => send(message.id)}
                          disabled={reply.trim().length < 10}
                          loading={pending === message.id}
                        >
                          {pending !== message.id ? <Send aria-hidden /> : null}
                          Send reply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => archive(message.id)}
                        >
                          <Archive aria-hidden />
                          Archive
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
