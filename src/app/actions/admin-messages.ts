"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, AuthorizationError } from "@/lib/auth-helpers";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { renderEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { messageReplySchema } from "@/lib/validations/misc";
import type { MessageStatus } from "@prisma/client";

export interface MessageActionResult {
  ok: boolean;
  message?: string;
}

/** Sends a reply to an enquiry and records it against the message. */
export async function replyToMessage(
  raw: unknown,
): Promise<MessageActionResult> {
  const parsed = messageReplySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Write a reply first.",
    };
  }

  try {
    const admin = await assertAdmin();

    const enquiry = await prisma.message.findUnique({
      where: { id: parsed.data.messageId },
      select: { id: true, name: true, email: true, subject: true, body: true },
    });
    if (!enquiry) {
      return { ok: false, message: "That message no longer exists." };
    }

    const { html, text } = renderEmail({
      preheader: `Re: ${enquiry.subject}`,
      heading: `Re: ${enquiry.subject}`,
      paragraphs: [
        `${enquiry.name},`,
        parsed.data.replyBody,
        "— The laboratory team",
      ],
      footnote:
        "Reply to this email to continue the conversation with the analyst handling your enquiry.",
    });

    const sent = await sendEmail({
      to: enquiry.email,
      subject: `Re: ${enquiry.subject} — LAVA Diagnostics`,
      html,
      text,
    });

    if (!sent.ok) {
      return {
        ok: false,
        message: "The reply could not be sent. Nothing has been recorded.",
      };
    }

    await prisma.message.update({
      where: { id: enquiry.id },
      data: {
        status: "REPLIED",
        replyBody: parsed.data.replyBody,
        repliedAt: new Date(),
        repliedBy: admin.email,
      },
    });

    await recordAudit({
      action: "message.replied",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Message",
      entityId: enquiry.id,
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Reply sent." };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[messages] reply failed", error);
    return { ok: false, message: "Could not send the reply." };
  }
}

/** Marks a message read, unread or archived. */
export async function setMessageStatus(
  messageId: string,
  status: MessageStatus,
): Promise<MessageActionResult> {
  try {
    const admin = await assertAdmin();

    await prisma.message.update({
      where: { id: messageId },
      data: { status },
    });

    await recordAudit({
      action: "message.status_changed",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Message",
      entityId: messageId,
      metadata: { status },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[messages] status change failed", error);
    return { ok: false, message: "Could not update this message." };
  }
}
