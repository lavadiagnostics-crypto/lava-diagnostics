import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal } from "@/components/shared/motion";
import {
  SubmissionForm,
  type SubmissionDefaults,
} from "@/app/submit/submission-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Submit Samples for Testing",
  description:
    "Build your submission online, choose analyses per sample, and receive an itemised estimate and order number immediately.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/submit" },
};

/**
 * Submission entry point.
 *
 * Open to anonymous visitors - requiring an account before a first order is a
 * needless barrier. Signed-in clients get their details pre-filled.
 */
export default async function SubmitPage() {
  const session = await auth();

  let defaults: SubmissionDefaults | undefined;

  if (session?.user?.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: session.user.customerId },
      select: {
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        vatNumber: true,
        shippingLine1: true,
        shippingLine2: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
      },
    });

    if (customer) {
      defaults = {
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        vatNumber: customer.vatNumber ?? "",
        shipping: {
          line1: customer.shippingLine1 ?? "",
          line2: customer.shippingLine2 ?? "",
          city: customer.shippingCity ?? "",
          state: customer.shippingState ?? "",
          postalCode: customer.shippingPostalCode ?? "",
          country: customer.shippingCountry ?? "",
        },
      };
    }
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-30 dark:opacity-20" />
        <div className="container relative py-14 sm:py-20">
          <Reveal className="max-w-3xl">
            <Badge variant="primary" size="lg" className="mb-6">
              <FlaskConical aria-hidden />
              Sample Submission
            </Badge>
            <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tightest sm:text-5xl">
              Submit Samples for Testing
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Add each sample, choose its analyses, and watch your estimate update
              as you go. Every service is for research use only.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <SubmissionForm
          defaults={defaults}
          isAuthenticated={Boolean(session?.user)}
        />
      </section>
    </>
  );
}
