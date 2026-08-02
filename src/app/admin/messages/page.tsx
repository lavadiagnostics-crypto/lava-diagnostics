import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { EmptyState, SectionHeading } from "@/components/shared/empty-state";
import { MessageList } from "@/app/admin/messages/message-list";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  await requireAdmin();

  const messages = await prisma.message.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      phone: true,
      subject: true,
      body: true,
      status: true,
      replyBody: true,
      repliedAt: true,
      repliedBy: true,
      createdAt: true,
      customerId: true,
    },
  });

  const unread = messages.filter((m) => m.status === "UNREAD").length;

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeading
        overline="Administration"
        title="Messages"
        description={
          unread > 0
            ? `${unread} enquiry${unread === 1 ? "" : "s"} awaiting a reply.`
            : "Enquiries from the contact form."
        }
      />

      <div className="mt-9">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages"
            description="Enquiries submitted through the contact form will appear here."
          />
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
    </div>
  );
}
