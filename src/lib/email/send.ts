import { serverEnv } from "@/lib/env";

/**
 * Transactional email dispatch.
 *
 * Two drivers: Resend for production, and a console driver that prints the
 * message so the whole order/certificate lifecycle is exercisable locally
 * without an API key.
 *
 * Sends never throw. A failed notification must not roll back the state change
 * that triggered it — an admin marking an order COMPLETED should succeed even
 * if the mail provider is down. Callers receive `{ ok: false }` and the failure
 * is recorded on the OrderEvent so it can be retried.
 */

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  let env: ReturnType<typeof serverEnv>;
  try {
    env = serverEnv();
  } catch (error) {
    console.error("[email] environment invalid, not sending", error);
    return { ok: false, error: "Email environment is not configured." };
  }

  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (env.EMAIL_DRIVER === "console") {
    console.info(
      [
        "",
        "┌─ email (console driver) ───────────────────────────",
        `│ to:      ${recipients.join(", ")}`,
        `│ from:    ${env.EMAIL_FROM}`,
        `│ subject: ${input.subject}`,
        "├────────────────────────────────────────────────────",
        input.text
          .split("\n")
          .map((line) => `│ ${line}`)
          .join("\n"),
        "└────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { ok: true, id: `console-${Date.now()}` };
  }

  try {
    // Imported lazily so the SDK is not bundled when the console driver is used.
    const { Resend } = await import("resend");
    const resend = new Resend(env.RESEND_API_KEY!);

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo ?? env.EMAIL_REPLY_TO,
    });

    if (error) {
      console.error("[email] provider rejected message", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    console.error("[email] send threw", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}
