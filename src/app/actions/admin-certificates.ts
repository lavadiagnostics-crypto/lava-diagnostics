"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, AuthorizationError } from "@/lib/auth-helpers";
import { recordAudit } from "@/lib/audit";
import { certificateHash, sha256 } from "@/lib/crypto";
import { sendCoaReady } from "@/lib/email/templates";
import {
  allocateCertificateNumber,
  generateVerificationToken,
} from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl } from "@/lib/qr";
import {
  looksLikePdf,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  sanitiseFilename,
  storage,
  storageKeys,
} from "@/lib/storage";
import {
  certificateMetadataSchema,
  revokeSchema,
} from "@/lib/validations/certificate";
import type { Prisma } from "@prisma/client";

/**
 * Certificate lifecycle — the most security-sensitive admin surface.
 *
 * Invariants enforced here:
 *
 *  • A newly uploaded certificate is PRIVATE unless the admin explicitly asks
 *    for immediate release. An accidental upload is therefore not a disclosure.
 *  • The verification token is generated server-side with 160 bits of entropy
 *    and is never accepted from the request.
 *  • The certificate hash covers the PDF bytes, so replacing the document always
 *    produces a new hash and bumps the revision.
 *  • Every state change is audited with the acting administrator's identity.
 */

export interface CertificateActionResult {
  ok: boolean;
  message?: string;
  certificateId?: string;
  certificateNumber?: string;
  fieldErrors?: Record<string, string[]>;
}

/** Reads a `File` from FormData, enforcing type and size limits. */
async function readPdf(
  file: File | null,
): Promise<{ buffer: Buffer; error?: string }> {
  if (!file || file.size === 0) {
    return { buffer: Buffer.alloc(0), error: "Attach the certificate PDF." };
  }
  if (file.size > MAX_PDF_BYTES) {
    return {
      buffer: Buffer.alloc(0),
      error: `That PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_PDF_BYTES / 1024 / 1024} MB.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Content sniffing, not just the declared MIME type — a renamed executable
  // would otherwise be accepted and served back with a PDF content type.
  if (!looksLikePdf(buffer)) {
    return {
      buffer: Buffer.alloc(0),
      error: "That file is not a valid PDF.",
    };
  }
  return { buffer };
}

/**
 * Creates a certificate from an uploaded PDF plus metadata.
 *
 * Takes FormData rather than a plain object because it carries a file. The
 * caller is the drag-and-drop upload form in the admin COA library.
 */
export async function createCertificate(
  formData: FormData,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const { buffer: pdfBuffer, error: pdfError } = await readPdf(
      formData.get("pdf") as File | null,
    );
    if (pdfError) return { ok: false, message: pdfError };

    const parsed = certificateMetadataSchema.safeParse({
      customerId: formData.get("customerId"),
      orderId: formData.get("orderId") || "",
      sampleId: formData.get("sampleId") || "",
      product: formData.get("product"),
      batchNumber: formData.get("batchNumber"),
      lotNumber: formData.get("lotNumber") || "",
      result: formData.get("result"),
      purityResult: formData.get("purityResult") || "",
      contentResult: formData.get("contentResult") || "",
      testedFor: formData.getAll("testedFor").map(String).filter(Boolean),
      summary: formData.get("summary") || "",
      signedBy: formData.get("signedBy") || "",
      signedTitle: formData.get("signedTitle") || "",
      issuedDate: formData.get("issuedDate"),
      internalNotes: formData.get("internalNotes") || "",
      releaseImmediately: formData.get("releaseImmediately") === "true",
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = parsed.data;

    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true, companyName: true, email: true, contactPerson: true },
    });
    if (!customer) {
      return { ok: false, message: "That customer no longer exists." };
    }

    const certificateNumber = await allocateCertificateNumber();
    const verificationToken = generateVerificationToken();
    const issuedDate = new Date(data.issuedDate);

    // Hash binds the metadata to these exact PDF bytes.
    const pdfSha256 = sha256(pdfBuffer);
    const hash = certificateHash({
      certificateNumber,
      customerName: customer.companyName,
      product: data.product,
      batchNumber: data.batchNumber,
      issuedDate,
      pdfSha256,
    });

    const qrCode = await generateQrDataUrl(verificationToken);

    /*
     * Create the row first so the object key can include the id, then upload.
     * If the upload fails, the row is deleted — better a rolled-back create than
     * a certificate row pointing at a nonexistent object.
     */
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        verificationToken,
        customerId: customer.id,
        orderId: data.orderId || null,
        sampleId: data.sampleId || null,
        customerName: customer.companyName,
        product: data.product,
        batchNumber: data.batchNumber,
        lotNumber: data.lotNumber || null,
        testedFor: data.testedFor,
        result: data.result,
        purityResult: data.purityResult ? data.purityResult : null,
        contentResult: data.contentResult ? data.contentResult : null,
        summary: data.summary || null,
        signedBy: data.signedBy || null,
        signedTitle: data.signedTitle || null,
        internalNotes: data.internalNotes || null,
        issuedDate,
        hash,
        qrCode,
        // Placeholder replaced immediately below once the key is known.
        pdfPath: "",
        pdfSizeBytes: pdfBuffer.byteLength,
        status: data.releaseImmediately ? "VERIFIED" : "PRIVATE",
        releasedAt: data.releaseImmediately ? new Date() : null,
        createdBy: admin.email,
      },
      select: { id: true, revision: true },
    });

    const pdfPath = storageKeys.certificatePdf(
      certificate.id,
      certificate.revision,
    );

    try {
      await storage().upload({
        key: pdfPath,
        body: pdfBuffer,
        contentType: "application/pdf",
      });
    } catch (uploadError) {
      await prisma.certificate.delete({ where: { id: certificate.id } });
      console.error("[certificates] upload failed, row rolled back", uploadError);
      return {
        ok: false,
        message:
          "The PDF could not be stored, so nothing was saved. Check your storage configuration and try again.",
      };
    }

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { pdfPath },
    });

    await recordAudit({
      action: "certificate.created",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificate.id,
      metadata: {
        certificateNumber,
        product: data.product,
        batchNumber: data.batchNumber,
        result: data.result,
        releasedImmediately: data.releaseImmediately,
      },
    });

    // Release notification, if the admin asked for immediate release.
    if (data.releaseImmediately) {
      await notifyRelease(certificate.id);
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/dashboard/certificates");

    return {
      ok: true,
      certificateId: certificate.id,
      certificateNumber,
      message: data.releaseImmediately
        ? `${certificateNumber} created and released. The customer has been emailed.`
        : `${certificateNumber} created as PRIVATE. It is not yet verifiable by anyone.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] create failed", error);
    return { ok: false, message: "Could not create the certificate." };
  }
}

/** Sends the COA-ready email and creates the portal notification. */
async function notifyRelease(certificateId: string): Promise<boolean> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: {
      id: true,
      certificateNumber: true,
      verificationToken: true,
      product: true,
      batchNumber: true,
      result: true,
      customerId: true,
      customer: { select: { email: true, contactPerson: true } },
      order: { select: { orderNumber: true } },
    },
  });
  if (!certificate) return false;

  await prisma.notification.create({
    data: {
      customerId: certificate.customerId,
      title: `Certificate ${certificate.certificateNumber} released`,
      body: `Your Certificate of Analysis for ${certificate.product} (batch ${certificate.batchNumber}) is ready to view.`,
      href: `/verify/${certificate.verificationToken}`,
      icon: "certificate",
    },
  });

  const result = await sendCoaReady({
    to: certificate.customer.email,
    contactPerson: certificate.customer.contactPerson,
    orderNumber: certificate.order?.orderNumber ?? null,
    certificateNumber: certificate.certificateNumber,
    verificationToken: certificate.verificationToken,
    product: certificate.product,
    batchNumber: certificate.batchNumber,
    result: certificate.result,
  });

  return result.ok;
}

/**
 * Releases a PRIVATE certificate, making it verifiable.
 *
 * This is the moment a certificate becomes reachable by anyone holding its
 * number or QR code, so it is a deliberate, audited, single-purpose action
 * rather than a side effect of editing metadata.
 */
export async function releaseCertificate(
  certificateId: string,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, status: true, certificateNumber: true },
    });
    if (!certificate) {
      return { ok: false, message: "That certificate no longer exists." };
    }
    if (certificate.status === "VERIFIED") {
      return { ok: false, message: "This certificate is already released." };
    }
    if (certificate.status === "REVOKED") {
      return {
        ok: false,
        message:
          "A revoked certificate cannot be re-released. Issue a new revision instead.",
      };
    }

    await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: "VERIFIED", releasedAt: new Date() },
    });

    const emailed = await notifyRelease(certificateId);

    await recordAudit({
      action: "certificate.released",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificateId,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        emailSent: emailed,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/certificates/${certificateId}`);
    revalidatePath("/dashboard/certificates");

    return {
      ok: true,
      message: emailed
        ? `${certificate.certificateNumber} released and the customer emailed.`
        : `${certificate.certificateNumber} released, but the notification email failed.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] release failed", error);
    return { ok: false, message: "Could not release this certificate." };
  }
}

/** Returns a released certificate to PRIVATE, making it unverifiable again. */
export async function makeCertificatePrivate(
  certificateId: string,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { certificateNumber: true, status: true },
    });
    if (!certificate) {
      return { ok: false, message: "That certificate no longer exists." };
    }

    await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: "PRIVATE", releasedAt: null },
    });

    await recordAudit({
      action: "certificate.made_private",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificateId,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        previousStatus: certificate.status,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/certificates/${certificateId}`);
    revalidatePath("/dashboard/certificates");

    return {
      ok: true,
      message: `${certificate.certificateNumber} is private again. Verification now reports it as not found.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] make private failed", error);
    return { ok: false, message: "Could not change this certificate." };
  }
}

/**
 * Revokes a certificate.
 *
 * Distinct from making it private: a revoked certificate still resolves, and
 * tells the holder it was withdrawn and why. That is the correct behaviour — a
 * person holding a void document needs to know it is void, not be told it never
 * existed.
 */
export async function revokeCertificate(
  raw: unknown,
): Promise<CertificateActionResult> {
  const parsed = revokeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "A reason is required.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const admin = await assertAdmin();

    const certificate = await prisma.certificate.findUnique({
      where: { id: parsed.data.certificateId },
      select: { certificateNumber: true, customerId: true },
    });
    if (!certificate) {
      return { ok: false, message: "That certificate no longer exists." };
    }

    await prisma.certificate.update({
      where: { id: parsed.data.certificateId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revocationReason: parsed.data.reason,
      },
    });

    await prisma.notification.create({
      data: {
        customerId: certificate.customerId,
        title: `Certificate ${certificate.certificateNumber} revoked`,
        body: `This certificate has been withdrawn: ${parsed.data.reason}`,
        href: "/dashboard/certificates",
        icon: "certificate",
      },
    });

    await recordAudit({
      action: "certificate.revoked",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: parsed.data.certificateId,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        reason: parsed.data.reason,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/certificates/${parsed.data.certificateId}`);
    revalidatePath("/dashboard/certificates");

    return {
      ok: true,
      message: `${certificate.certificateNumber} revoked. Verification now reports it as withdrawn.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] revoke failed", error);
    return { ok: false, message: "Could not revoke this certificate." };
  }
}

/** Archives a superseded certificate. Verification reports it as not found. */
export async function archiveCertificate(
  certificateId: string,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: "ARCHIVED" },
      select: { certificateNumber: true },
    });

    await recordAudit({
      action: "certificate.archived",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificateId,
      metadata: { certificateNumber: certificate.certificateNumber },
    });

    revalidatePath("/admin/certificates");
    return { ok: true, message: `${certificate.certificateNumber} archived.` };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] archive failed", error);
    return { ok: false, message: "Could not archive this certificate." };
  }
}

/**
 * Replaces the PDF, bumping the revision and recomputing the hash.
 *
 * The verification token is deliberately preserved so QR codes already printed
 * on physical documentation keep working. The hash changes, which is the point —
 * a holder comparing hashes can tell the document was reissued.
 */
export async function replaceCertificatePdf(
  formData: FormData,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const certificateId = String(formData.get("certificateId") ?? "");
    if (!certificateId) {
      return { ok: false, message: "Missing certificate reference." };
    }

    const { buffer, error } = await readPdf(formData.get("pdf") as File | null);
    if (error) return { ok: false, message: error };

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: {
        id: true,
        certificateNumber: true,
        customerName: true,
        product: true,
        batchNumber: true,
        issuedDate: true,
        revision: true,
        pdfPath: true,
      },
    });
    if (!certificate) {
      return { ok: false, message: "That certificate no longer exists." };
    }

    const nextRevision = certificate.revision + 1;
    const newPath = storageKeys.certificatePdf(certificate.id, nextRevision);

    await storage().upload({
      key: newPath,
      body: buffer,
      contentType: "application/pdf",
    });

    const hash = certificateHash({
      certificateNumber: certificate.certificateNumber,
      customerName: certificate.customerName,
      product: certificate.product,
      batchNumber: certificate.batchNumber,
      issuedDate: certificate.issuedDate,
      pdfSha256: sha256(buffer),
    });

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        pdfPath: newPath,
        pdfSizeBytes: buffer.byteLength,
        revision: nextRevision,
        hash,
      },
    });

    // Remove the superseded object only after the new one is committed.
    if (certificate.pdfPath && certificate.pdfPath !== newPath) {
      await storage()
        .remove([certificate.pdfPath])
        .catch((cleanupError) =>
          console.error(
            "[certificates] could not delete superseded PDF",
            cleanupError,
          ),
        );
    }

    await recordAudit({
      action: "certificate.pdf_replaced",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificate.id,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        revision: nextRevision,
      },
    });

    revalidatePath(`/admin/certificates/${certificate.id}`);
    revalidatePath("/admin/certificates");

    return {
      ok: true,
      message: `PDF replaced. ${certificate.certificateNumber} is now revision ${nextRevision} with a new hash.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] PDF replace failed", error);
    return { ok: false, message: "Could not replace the PDF." };
  }
}

/** Attaches a chromatogram or spectrum image to a certificate. */
export async function uploadCertificateAsset(
  formData: FormData,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const certificateId = String(formData.get("certificateId") ?? "");
    const kind = String(formData.get("kind") ?? "");
    const file = formData.get("file") as File | null;

    if (kind !== "chromatogram" && kind !== "spectrum") {
      return { ok: false, message: "Unknown asset type." };
    }
    if (!file || file.size === 0) {
      return { ok: false, message: "Attach a file." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        message: `That file is too large. The limit is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`,
      };
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, certificateNumber: true },
    });
    if (!certificate) {
      return { ok: false, message: "That certificate no longer exists." };
    }

    const filename = sanitiseFilename(file.name);
    const key =
      kind === "chromatogram"
        ? storageKeys.chromatogram(certificate.id, filename)
        : storageKeys.spectrum(certificate.id, filename);

    await storage().upload({
      key,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
    });

    await prisma.certificate.update({
      where: { id: certificate.id },
      data:
        kind === "chromatogram"
          ? { chromatogramPaths: { push: key } }
          : { spectrumPaths: { push: key } },
    });

    await recordAudit({
      action: "certificate.asset_uploaded",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificate.id,
      metadata: { kind, filename },
    });

    revalidatePath(`/admin/certificates/${certificate.id}`);
    return { ok: true, message: `${kind} attached.` };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] asset upload failed", error);
    return { ok: false, message: "Could not attach the file." };
  }
}

/** Updates editable metadata. Never touches the token, status or hash inputs. */
export async function updateCertificateMetadata(
  certificateId: string,
  raw: unknown,
): Promise<CertificateActionResult> {
  const schema = certificateMetadataSchema
    .omit({ customerId: true, releaseImmediately: true })
    .partial();

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const admin = await assertAdmin();
    const data = parsed.data;

    const update: Prisma.CertificateUpdateInput = {
      ...(data.product ? { product: data.product } : {}),
      ...(data.batchNumber ? { batchNumber: data.batchNumber } : {}),
      ...(data.lotNumber !== undefined
        ? { lotNumber: data.lotNumber || null }
        : {}),
      ...(data.result ? { result: data.result } : {}),
      ...(data.purityResult !== undefined
        ? { purityResult: data.purityResult ? data.purityResult : null }
        : {}),
      ...(data.contentResult !== undefined
        ? { contentResult: data.contentResult ? data.contentResult : null }
        : {}),
      ...(data.testedFor ? { testedFor: data.testedFor } : {}),
      ...(data.summary !== undefined ? { summary: data.summary || null } : {}),
      ...(data.signedBy !== undefined
        ? { signedBy: data.signedBy || null }
        : {}),
      ...(data.signedTitle !== undefined
        ? { signedTitle: data.signedTitle || null }
        : {}),
      ...(data.internalNotes !== undefined
        ? { internalNotes: data.internalNotes || null }
        : {}),
    };

    await prisma.certificate.update({
      where: { id: certificateId },
      data: update,
    });

    await recordAudit({
      action: "certificate.metadata_updated",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificateId,
      metadata: { fields: Object.keys(update) },
    });

    revalidatePath(`/admin/certificates/${certificateId}`);
    revalidatePath("/admin/certificates");
    return { ok: true, message: "Metadata updated." };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] metadata update failed", error);
    return { ok: false, message: "Could not update metadata." };
  }
}

/**
 * Permanently deletes a certificate and its objects.
 *
 * Intended only for genuine mistakes — an upload against the wrong customer, or
 * a test record. A certificate that was ever released should be REVOKED instead,
 * so that holders of the document learn it is void rather than finding it
 * silently absent.
 */
export async function deleteCertificate(
  certificateId: string,
): Promise<CertificateActionResult> {
  try {
    const admin = await assertAdmin();

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: {
        certificateNumber: true,
        status: true,
        pdfPath: true,
        thumbnailPath: true,
        chromatogramPaths: true,
        spectrumPaths: true,
      },
    });
    if (!certificate) {
      return { ok: false, message: "That certificate no longer exists." };
    }

    if (certificate.status === "VERIFIED") {
      return {
        ok: false,
        message:
          "A released certificate cannot be deleted. Revoke it instead, so anyone holding a copy is told it is void.",
      };
    }

    const keys = [
      certificate.pdfPath,
      certificate.thumbnailPath,
      ...certificate.chromatogramPaths,
      ...certificate.spectrumPaths,
    ].filter((key): key is string => Boolean(key));

    await prisma.certificate.delete({ where: { id: certificateId } });

    // Objects are removed after the row, so a storage error cannot leave an
    // undeletable record behind.
    if (keys.length > 0) {
      await storage()
        .remove(keys)
        .catch((cleanupError) =>
          console.error(
            "[certificates] objects orphaned after delete",
            keys,
            cleanupError,
          ),
        );
    }

    await recordAudit({
      action: "certificate.deleted",
      userId: admin.userId,
      actorEmail: admin.email,
      entity: "Certificate",
      entityId: certificateId,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        previousStatus: certificate.status,
      },
    });

    revalidatePath("/admin/certificates");
    return {
      ok: true,
      message: `${certificate.certificateNumber} deleted permanently.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: error.message };
    }
    console.error("[certificates] delete failed", error);
    return { ok: false, message: "Could not delete this certificate." };
  }
}
