import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/shared/motion";
import { BRAND } from "@/lib/constants";

/**
 * Legal pages.
 *
 * Content is drafted as a starting point and clearly flagged as requiring
 * review by qualified counsel before the site goes live - publishing
 * unreviewed terms is a liability, not a feature.
 */

interface LegalDoc {
  title: string;
  description: string;
  updated: string;
  sections: { heading: string; paragraphs: string[] }[];
}

const DOCS: Record<string, LegalDoc> = {
  terms: {
    title: "Terms of Service",
    description:
      "The terms governing analytical services provided by LAVA Diagnostics.",
    updated: "30 July 2026",
    sections: [
      {
        heading: "1. Scope of services",
        paragraphs: [
          `${BRAND.name} ("the Laboratory") provides analytical testing services on samples submitted by the client. The Laboratory reports the results of the analyses it performs on the specific samples it receives. No result extends to material the Laboratory did not test, including other units of the same batch.`,
          "The Laboratory does not manufacture, distribute, resell or broker research peptides, and holds no commercial interest in the outcome of any analysis.",
        ],
      },
      {
        heading: "2. Research use only",
        paragraphs: [
          "All services are provided for laboratory research purposes. No analytical result constitutes a safety assessment, an efficacy assessment, a regulatory clearance, a fitness-for-purpose determination, or an authorisation of any kind for human or veterinary use.",
          "The client agrees not to present any Certificate of Analysis, in whole or in part, as evidence that material is safe for, approved for, or intended for administration to humans or animals.",
        ],
      },
      {
        heading: "3. Samples and acceptance",
        paragraphs: [
          "Samples must arrive in crimped, unopened vials unless otherwise agreed in writing. The Laboratory reserves the right to decline any sample at receiving, including samples outside its accepted scope, samples with compromised container integrity, and samples whose declared contents do not match their apparent contents.",
          "The Laboratory does not accept human growth hormone, HCG, HMG, testosterone or related hormone preparations, or cosmetic injectables of unverified origin. Declined samples are returned at the client's cost or disposed of at the client's written instruction.",
          "Retained material is held for ninety days following certificate issuance unless a longer retention period is agreed in writing, after which it is disposed of in accordance with applicable waste regulations.",
        ],
      },
      {
        heading: "4. Results and reporting",
        paragraphs: [
          "The Laboratory reports results as measured. A result that does not meet the client's expectation or specification is reported with the same rigour as one that does. The Laboratory will not withdraw, amend, suppress or re-issue a result on the basis of client dissatisfaction.",
          "Every certificate is reviewed and approved by a second analyst prior to release. A certificate may be revoked and superseded where a transcription or calculation error is identified, in which case the client is notified and the revoked certificate verifies as revoked rather than being deleted.",
          "The Certificate of Analysis names only the company, organisation or individual identified by the client on the submission form. The Laboratory does not add third parties to a certificate.",
        ],
      },
      {
        heading: "5. Certificate verification and confidentiality",
        paragraphs: [
          "The Laboratory operates a verification facility allowing a holder of a certificate number or QR code to confirm a certificate's authenticity and contents. The Laboratory does not publish, list, index or otherwise make browsable any directory of certificates.",
          "Results are treated as confidential to the submitting client and are not disclosed to third parties except as required by law or where the client has shared the certificate reference. The client acknowledges that any party they give a certificate number or QR code to will be able to view that certificate.",
        ],
      },
      {
        heading: "6. Fees and payment",
        paragraphs: [
          "Fees are as stated at the time of submission. Estimates shown during submission are indicative; the invoiced amount is confirmed at invoicing and reflects applicable volume tiers. Fees do not vary according to the outcome of an analysis.",
          "Invoices are payable within fourteen days of issue unless other terms are agreed in writing. The Laboratory does not withhold results pending payment.",
        ],
      },
      {
        heading: "7. Limitation of liability",
        paragraphs: [
          "The Laboratory's total liability arising from any order is limited to the fees paid for that order. The Laboratory is not liable for indirect, consequential, incidental or economic loss, including loss of profit, loss of contract, product recall costs, or loss arising from the client's or any third party's reliance on a result.",
          "Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for fraud or for death or personal injury caused by negligence.",
        ],
      },
      {
        heading: "8. Governing law",
        paragraphs: [
          "These terms are governed by the laws of the State of Tennessee, United States, and the parties submit to the exclusive jurisdiction of its courts.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    description:
      "How LAVA Diagnostics collects, uses and protects personal information.",
    updated: "30 July 2026",
    sections: [
      {
        heading: "1. Information we collect",
        paragraphs: [
          "When you submit samples or create an account we collect the contact and billing information you provide: name, company or organisation, email address, telephone number, and shipping and billing addresses. We collect the sample metadata you enter, including product names, batch numbers and requested analyses.",
          "When you use the certificate verification facility we record the fact of the lookup, a truncated fragment of the reference queried, whether it succeeded, a keyed one-way hash of your IP address, and your browser's user-agent string. We do not store your raw IP address.",
          "We do not use advertising cookies, third-party analytics trackers, or cross-site tracking of any kind.",
        ],
      },
      {
        heading: "2. Why we collect it",
        paragraphs: [
          "Contact and sample information is used to perform the analytical services you request, to issue and verify your certificates, to invoice you, and to notify you about the progress of your orders. These are transactional communications necessary to deliver the service and are not marketing.",
          "Verification lookup records exist to detect and prevent abuse of the verification endpoint, in particular attempts to enumerate certificates. This is a legitimate-interests basis: without it, the confidentiality of our clients' certificates could not be protected.",
          "We send service and product announcements only to recipients who have explicitly opted in, and every such message carries an unsubscribe link.",
        ],
      },
      {
        heading: "3. Certificates and confidentiality",
        paragraphs: [
          "Certificate documents are stored in private object storage that is not publicly accessible. A certificate document is served only after a successful verification, and only for the certificate that was verified.",
          "We never publish a list of certificates, and we do not permit search engines to index certificate pages. Anyone you give a certificate number or QR code to will be able to view that certificate, so treat those references as confidential to the extent you wish the results to remain so.",
        ],
      },
      {
        heading: "4. Sharing",
        paragraphs: [
          "We do not sell personal information. We share it only with service providers who process it on our behalf under contract - our hosting provider, database provider, object-storage provider and transactional email provider - and only to the extent necessary to operate the service.",
          "We disclose information where required by law, and we will notify you of any such request unless legally prohibited from doing so.",
        ],
      },
      {
        heading: "5. Retention",
        paragraphs: [
          "Analytical records and certificates are retained for a minimum of seven years, as required for the traceability of a laboratory record. Verification lookup logs are retained for twelve months. Account information is retained while your account is active and for seven years thereafter for accounting purposes.",
        ],
      },
      {
        heading: "6. Your rights",
        paragraphs: [
          `You may request access to, correction of, or deletion of your personal information by contacting ${BRAND.email}. Note that we cannot delete an issued analytical record within its mandatory retention period, as doing so would compromise the integrity of the certificate register that third parties rely on.`,
          "Depending on your location you may have additional rights, including the right to data portability, the right to object to processing, and the right to lodge a complaint with your supervisory authority.",
        ],
      },
    ],
  },

  "research-use": {
    title: "Research Use Only",
    description:
      "The scope and limits of what a LAVA Diagnostics certificate means.",
    updated: "30 July 2026",
    sections: [
      {
        heading: "What our services are",
        paragraphs: [
          "We perform analytical chemistry and microbiology on samples submitted to us, and we report what we measured. A Certificate of Analysis is a factual record of composition: how pure a sample was under a stated method, whether its mass was consistent with a claimed sequence, how much active peptide a vial contained, and whether specified contaminants were detected.",
        ],
      },
      {
        heading: "What our services are not",
        paragraphs: [
          "A Certificate of Analysis is not a determination that material is safe. It is not a determination that material is effective. It is not a regulatory approval, a licence, a marketing authorisation, or a clearance of any kind. It does not indicate that material is suitable for administration to humans or animals, and it must never be presented as though it did.",
          "Composition and safety are different questions. A sample can be 99.8% pure, correctly identified, sterile, endotoxin-free and entirely unsuitable for any living thing. Purity is not safety.",
        ],
      },
      {
        heading: "Scope of a result",
        paragraphs: [
          "A result describes the sample we received, on the date we received it, under the method stated. It does not describe other units of the same batch, material stored or handled differently, or material that has since been opened, reconstituted or repackaged.",
          "Sterility in particular is destroyed by the first non-aseptic entry into a container. A passing sterility result describes a sealed unit and says nothing about that unit once opened.",
        ],
      },
      {
        heading: "How we expect certificates to be used",
        paragraphs: [
          "We expect our certificates to be used as evidence of composition - to qualify a supplier, to verify a label claim, to investigate a suspected substitution, or to demonstrate to a customer that a claim was independently checked.",
          `We expect them not to be used to imply endorsement, approval, safety, or fitness for human use. Where we become aware of a certificate being misrepresented in that way, we reserve the right to revoke it and to decline further work. If you have questions about how a result may properly be described, contact us at ${BRAND.email} before publishing.`,
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) return { title: "Not found" };

  return {
    title: doc.title,
    description: doc.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();

  return (
    <article className="container py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl">
        <p className="overline mb-4">Legal</p>
        <h1 className="text-balance text-3xl font-semibold leading-[1.12] tracking-tightest sm:text-[2.6rem]">
          {doc.title}
        </h1>
        <p className="mt-5 text-[15px] text-muted-foreground">
          Last updated {doc.updated}
        </p>

        {/*
          Deliberately prominent. These documents are a drafting starting point,
          not legal advice, and shipping them unreviewed would be a mistake.
        */}
        <div className="mt-8 rounded-2xl border border-lava-200 bg-lava-50/60 p-5 dark:border-lava-900/70 dark:bg-lava-950/25">
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold">Template notice.</strong> This
            document is a drafting starting point prepared alongside the platform.
            It is not legal advice and has not been reviewed by counsel. Have a
            qualified lawyer in your operating jurisdiction review and adapt it
            before this site accepts real clients.
          </p>
        </div>

        <div className="rule-fade my-12" />

        <div className="space-y-11">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-balance text-xl font-semibold tracking-tight">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-pretty text-[16px] leading-[1.72] text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Reveal>
    </article>
  );
}
