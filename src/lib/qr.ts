import QRCode from "qrcode";
import { appUrl } from "@/lib/env";

/**
 * QR payloads point at the token-bearing verification URL:
 *
 *   https://lavadiagnostics.com/verify/<verificationToken>
 *
 * The token - not the certificate number - is what the QR encodes, because the
 * token is the actual access credential. Anyone holding the physical certificate
 * can scan it; nobody can derive it from the visible certificate number.
 */

export function verificationUrl(verificationToken: string): string {
  return `${appUrl()}/verify/${verificationToken}`;
}

/** PNG data URL, sized and coloured for print on a COA. */
export async function generateQrDataUrl(
  verificationToken: string,
): Promise<string> {
  return QRCode.toDataURL(verificationUrl(verificationToken), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#1F1F1FFF", light: "#FFFFFFFF" },
  });
}

/** Scalable variant for the web verification page. */
export async function generateQrSvg(
  verificationToken: string,
): Promise<string> {
  return QRCode.toString(verificationUrl(verificationToken), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#1F1F1FFF", light: "#FFFFFF00" },
  });
}

/**
 * Extracts a verification token from scanned QR text.
 *
 * Accepts a full LAVA verify URL or a bare token, and rejects URLs pointing at
 * any other origin so a malicious QR cannot redirect a scan elsewhere.
 */
export function parseScannedValue(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(/\/verify\/([A-Za-z0-9_-]{8,64})\/?$/);
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }

  // Bare token or certificate number.
  if (/^[A-Za-z0-9_-]{8,64}$/.test(value)) return value;
  return null;
}
