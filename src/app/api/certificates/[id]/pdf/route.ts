import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { GRANT_COOKIE, safeEqual, verifyAccessGrant } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import {
  findBundledById,
  isBundledId,
  readBundledPdf,
} from "@/lib/certificates/bundled";

/**
 * Certificate PDF stream.
 *
 * This is the ONLY route that returns certificate bytes, and it is the reason
 * object storage can stay private. Three things are true of every response:
 *
 *   1. The caller proved entitlement before reaching here - by holding a signed
 *      grant cookie issued by a successful verification, by presenting the
 *      certificate's own verification token, or by being the owning customer or
 *      an administrator.
 *   2. No storage URL is ever handed to the browser. Bytes are proxied, so
 *      access remains revocable and auditable and cannot be shared as a link.
 *   3. Nothing is cacheable. A shared cache holding a certificate PDF would
 *      undo the access control entirely.
 *
 * A missing grant returns 404, not 403 - a 403 would confirm the certificate
 * exists, which is exactly what the verification model refuses to disclose.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  /*
   * Bundled certificates ship with the deployment and have no database row, so
   * they are resolved from the registry instead. Everything downstream —
   * authorisation, headers, logging — is identical.
   */
  const bundled = isBundledId(id) ? findBundledById(id) : null;

  const certificate = bundled
    ? {
        id: bundled.id,
        certificateNumber: bundled.certificateNumber,
        status: "VERIFIED" as const,
        pdfPath: bundled.file,
        customerId: bundled.id,
        verificationToken: bundled.verificationToken,
      }
    : await prisma.certificate.findUnique({
        where: { id },
        select: {
          id: true,
          certificateNumber: true,
          status: true,
          pdfPath: true,
          customerId: true,
          verificationToken: true,
        },
      });

  if (!certificate) return notFound();

  // ── Authorisation: any one of three paths ──
  let authorised = false;
  let via = "none";

  // 1. Grant cookie from a successful verification, scoped to this certificate.
  const store = await cookies();
  const grant = verifyAccessGrant(store.get(GRANT_COOKIE)?.value);
  if (grant?.certificateId === certificate.id) {
    // A grant does not survive revocation - status is re-checked here, not
    // trusted from when the grant was minted.
    if (certificate.status === "VERIFIED") {
      authorised = true;
      via = "grant";
    }
  }

  /*
   * 2. The verification token itself.
   *
   * This is the QR-scan path: `/verify/<token>` renders as a page, and Next 15
   * forbids setting a cookie during a render, so no grant exists yet. The token
   * is the bearer credential and is already in the address bar of the page
   * embedding this request, so accepting it here discloses nothing the visitor
   * does not already hold. Compared in constant time, and only for a certificate
   * that is currently released.
   */
  if (!authorised) {
    const supplied = request.nextUrl.searchParams.get("t");
    if (
      supplied &&
      certificate.status === "VERIFIED" &&
      safeEqual(supplied, certificate.verificationToken)
    ) {
      authorised = true;
      via = "token";
    }
  }

  // 3. Signed-in owner, or an admin.
  if (!authorised) {
    const session = await auth();
    if (session?.user) {
      if (session.user.role === "ADMIN") {
        // Admins may read a PRIVATE certificate - that is the review workflow.
        authorised = true;
        via = "admin";
      } else if (
        session.user.customerId === certificate.customerId &&
        certificate.status !== "ARCHIVED"
      ) {
        authorised = true;
        via = "owner";
      }
    }
  }

  if (!authorised) return notFound();

  const body = bundled
    ? await readBundledPdf(bundled)
    : (await storage().download(certificate.pdfPath))?.body ?? null;

  if (!body) {
    console.error(
      `[certificates] PDF bytes unavailable for ${certificate.certificateNumber} (${certificate.pdfPath})`,
    );
    return notFound();
  }

  /*
   * Disposition.
   *
   * `attachment` is offered only to a signed-in owner or an administrator — the
   * people whose own document it is. A public visitor who verified a certificate
   * gets `inline` regardless of what they put in the query string, so the
   * verification page is a viewer rather than a download link.
   *
   * This is a deliberate limit, not a guarantee: any browser's built-in PDF
   * viewer has its own save and print controls, so a determined visitor can
   * still keep a copy. Preventing that would mean not sending the PDF at all and
   * rendering page images instead.
   */
  const mayDownload = via === "owner" || via === "admin";
  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";
  const disposition = mayDownload && wantsDownload ? "attachment" : "inline";
  const filename = `${certificate.certificateNumber}.pdf`;

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      "X-Content-Type-Options": "nosniff",
      // Blocks a hostile page from framing the PDF to phish around it.
      "Content-Security-Policy": "default-src 'none'; object-src 'self'; frame-ancestors 'self'",
      "X-Access-Via": via,
    },
  });
}
