import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/shared/empty-state";
import { CertificateUploadForm } from "@/app/admin/certificates/new/upload-form";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Upload a COA" };

export default async function NewCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  await requireAdmin();
  const { orderId } = await searchParams;

  const [customers, orders] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true, email: true },
    }),
    /*
     * Orders that could plausibly need a certificate. Excludes rejected and
     * cancelled work, and caps the list - the selector is a convenience, not a
     * browsable archive.
     */
    prisma.order.findMany({
      where: {
        status: {
          in: [
            "ACCEPTED",
            "SAMPLE_RECEIVED",
            "TESTING",
            "AWAITING_RESULTS",
            "COMPLETED",
            "SHIPPED",
          ],
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 250,
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        samples: {
          select: {
            id: true,
            productName: true,
            batchNumber: true,
            sampleCode: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/certificates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        COA Library
      </Link>

      <SectionHeading
        className="mt-6"
        overline="Administration"
        title="Upload a Certificate of Analysis"
        description="Attach the completed PDF and record its metadata. The certificate number, verification token, QR code and integrity hash are generated automatically."
      />

      <div className="mt-9">
        <CertificateUploadForm
          customers={customers}
          orders={orders}
          defaultOrderId={orderId}
        />
      </div>
    </div>
  );
}
