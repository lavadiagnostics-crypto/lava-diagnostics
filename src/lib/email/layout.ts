import { appUrl } from "@/lib/env";

/**
 * Email shell.
 *
 * Table-based with inline styles — the only approach that survives Outlook,
 * Gmail's CSS stripping and Apple Mail dark mode simultaneously. No web fonts,
 * no external images, no media queries beyond a single max-width.
 */

export interface EmailButton {
  label: string;
  href: string;
}

export interface EmailLayoutInput {
  preheader: string;
  heading: string;
  /** Paragraphs of body copy. Plain strings; HTML is escaped. */
  paragraphs: string[];
  button?: EmailButton;
  /** Rendered as a bordered definition list, e.g. order details. */
  facts?: { label: string; value: string }[];
  /** Small print rendered under the divider. */
  footnote?: string;
}

const BRAND = "#FF5B2E";
const CHARCOAL = "#1F1F1F";
const MUTED = "#6D6D6D";
const HAIRLINE = "#E7E7E7";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmail(input: EmailLayoutInput): {
  html: string;
  text: string;
} {
  const base = appUrl();

  const factsHtml = input.facts?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;border:1px solid ${HAIRLINE};border-radius:12px;border-collapse:separate;overflow:hidden;">
        ${input.facts
          .map(
            (fact, i) => `<tr>
              <td style="padding:13px 18px;font:400 12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:${MUTED};${i > 0 ? `border-top:1px solid ${HAIRLINE};` : ""}width:44%;">${escapeHtml(fact.label)}</td>
              <td style="padding:13px 18px;font:600 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${CHARCOAL};${i > 0 ? `border-top:1px solid ${HAIRLINE};` : ""}">${escapeHtml(fact.value)}</td>
            </tr>`,
          )
          .join("")}
      </table>`
    : "";

  const buttonHtml = input.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
        <tr><td style="border-radius:999px;background:${BRAND};">
          <a href="${escapeHtml(input.button.href)}" style="display:inline-block;padding:14px 30px;font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;letter-spacing:.01em;">${escapeHtml(input.button.label)}</a>
        </td></tr>
      </table>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background:#F6F6F6;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F6F6F6;">
<tr><td align="center" style="padding:36px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:592px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 1px 3px rgba(31,31,31,.07);">
    <tr><td style="padding:30px 36px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;padding-right:11px;">
          <div style="width:30px;height:30px;border-radius:9px;background:${BRAND};"></div>
        </td>
        <td style="vertical-align:middle;">
          <div style="font:700 17px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${CHARCOAL};letter-spacing:-.02em;">LAVA Diagnostics</div>
          <div style="font:500 10px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};letter-spacing:.13em;text-transform:uppercase;margin-top:3px;">Independent Third-Party Laboratory</div>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:28px 36px 34px;">
      <h1 style="margin:0 0 16px;font:600 25px/1.28 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${CHARCOAL};letter-spacing:-.025em;">${escapeHtml(input.heading)}</h1>
      ${input.paragraphs
        .map(
          (p) =>
            `<p style="margin:0 0 14px;font:400 15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#4F4F4F;">${escapeHtml(p)}</p>`,
        )
        .join("")}
      ${factsHtml}
      ${buttonHtml}
      ${
        input.footnote
          ? `<p style="margin:26px 0 0;padding-top:20px;border-top:1px solid ${HAIRLINE};font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};">${escapeHtml(input.footnote)}</p>`
          : ""
      }
    </td></tr>

    <tr><td style="padding:20px 36px 30px;background:#FAFAFA;border-top:1px solid ${HAIRLINE};">
      <p style="margin:0 0 6px;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};">
        LAVA Diagnostics · Independent Third-Party Laboratory Testing<br>
        All services are provided for research use only and are not intended for human or veterinary use.
      </p>
      <p style="margin:0;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};">
        <a href="${base}/verify" style="color:${BRAND};text-decoration:none;">Verify a certificate</a>
        &nbsp;·&nbsp;
        <a href="${base}/contact" style="color:${BRAND};text-decoration:none;">Contact the lab</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    "LAVA DIAGNOSTICS",
    "Independent Third-Party Laboratory Testing",
    "",
    input.heading.toUpperCase(),
    "",
    ...input.paragraphs,
    ...(input.facts?.length
      ? ["", ...input.facts.map((f) => `${f.label}: ${f.value}`)]
      : []),
    ...(input.button ? ["", `${input.button.label}: ${input.button.href}`] : []),
    ...(input.footnote ? ["", input.footnote] : []),
    "",
    "—",
    "All services are for research use only.",
    `${base}/verify`,
  ].join("\n");

  return { html, text };
}
