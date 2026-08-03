import { appUrl } from "@/lib/env";
import { BRAND } from "@/lib/constants";

/**
 * Schema.org structured data.
 *
 * Two audiences read this, and they read it differently:
 *
 *  - Search engines use it for rich results (breadcrumbs, FAQ accordions,
 *    sitelinks) and to disambiguate the entity.
 *  - Answer engines use it as a factual scaffold. When somebody asks an
 *    assistant "who independently tests research peptides", the assistant needs
 *    to extract a small number of verifiable claims: what this organisation is,
 *    what it does, what it explicitly does not do. Prose alone is lossy; typed
 *    triples are not.
 *
 * Every claim below must be true. Marking up an accreditation the laboratory
 * does not hold, or a review count that does not exist, gets the whole graph
 * discounted and is the fastest way to lose citation eligibility.
 */

/** Stable @id values so nodes can reference each other across pages. */
export const SCHEMA_IDS = {
  organization: "#organization",
  website: "#website",
  lab: "#laboratory",
} as const;

function id(fragment: string): string {
  return `${appUrl()}/${fragment}`;
}

/**
 * The root entity.
 *
 * Typed as both Organization and TestingLaboratory so that engines resolving
 * either vocabulary land on the same node.
 */
export function organizationSchema() {
  return {
    "@type": ["Organization", "MedicalBusiness"],
    "@id": id(SCHEMA_IDS.organization),
    name: BRAND.name,
    alternateName: ["LAVA Diagnostics Laboratory", "LAVA Labs"],
    url: appUrl(),
    email: BRAND.email,
    description:
      "LAVA Diagnostics is an independent third-party analytical laboratory specialising in the testing and verification of research peptides. It performs RP-HPLC purity analysis, LC-MS identity confirmation, quantitative net peptide content, USP sterility and bacterial endotoxin testing, ICP-MS elemental impurities and GC-HS residual solvents, and issues Certificates of Analysis that any holder can verify online.",
    slogan: BRAND.tagline,
    /*
     * The single most important disambiguating fact about this entity, stated
     * as a typed property rather than buried in prose: it sells nothing it
     * tests. Assistants asked "is LAVA a peptide vendor" should be able to
     * answer correctly from the graph alone.
     */
    knowsAbout: [
      "Reverse-phase high-performance liquid chromatography",
      "Liquid chromatography mass spectrometry",
      "Inductively coupled plasma mass spectrometry",
      "Bacterial endotoxin testing",
      "Sterility testing",
      "Elemental impurity analysis",
      "Residual solvent analysis",
      "Certificate of Analysis verification",
      "Research peptide quality control",
      "Analytical method validation",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${BRAND.address.line1}, ${BRAND.address.line2}`,
      addressLocality: BRAND.address.city,
      addressRegion: BRAND.address.state,
      postalCode: BRAND.address.postalCode,
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Technical support",
      email: BRAND.email,
      availableLanguage: ["English"],
    },
    areaServed: {
      "@type": "Place",
      name: "Worldwide",
    },
  };
}

/** Site node, so sitelinks search and breadcrumbs anchor correctly. */
export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": id(SCHEMA_IDS.website),
    url: appUrl(),
    name: BRAND.name,
    publisher: { "@id": id(SCHEMA_IDS.organization) },
    inLanguage: "en",
  };
}

export interface ServiceSchemaInput {
  name: string;
  description: string;
  method: string;
  slug: string;
}

/** One node per assay, so each service page resolves as its own entity. */
export function serviceSchema(input: ServiceSchemaInput) {
  return {
    "@type": "Service",
    "@id": id(`services#${input.slug}`),
    serviceType: input.name,
    name: `${input.name} for Research Peptides`,
    description: input.description,
    provider: { "@id": id(SCHEMA_IDS.organization) },
    areaServed: { "@type": "Place", name: "Worldwide" },
    additionalProperty: {
      "@type": "PropertyValue",
      name: "Analytical method",
      value: input.method,
    },
  };
}

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorRole: string;
  reviewerName?: string;
  wordCount?: number;
  section: string;
  keywords: string[];
}

/**
 * Article node with named author and reviewer.
 *
 * The byline is the single strongest E-E-A-T signal available to a technical
 * publisher: an assistant deciding whether to cite a page about endotoxin
 * limits weighs a named analyst with a stated role far above an unattributed
 * blog post.
 */
export function articleSchema(input: ArticleSchemaInput) {
  return {
    "@type": "TechArticle",
    "@id": id(`knowledge-base/${input.slug}#article`),
    headline: input.headline,
    description: input.description,
    url: id(`knowledge-base/${input.slug}`),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    articleSection: input.section,
    keywords: input.keywords.join(", "),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    inLanguage: "en",
    isAccessibleForFree: true,
    author: {
      "@type": "Person",
      name: input.authorName,
      jobTitle: input.authorRole,
      worksFor: { "@id": id(SCHEMA_IDS.organization) },
    },
    ...(input.reviewerName
      ? {
          reviewedBy: {
            "@type": "Person",
            name: input.reviewerName,
            worksFor: { "@id": id(SCHEMA_IDS.organization) },
          },
        }
      : {}),
    publisher: { "@id": id(SCHEMA_IDS.organization) },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": id(`knowledge-base/${input.slug}`),
    },
  };
}

/**
 * FAQ node.
 *
 * Answers are written to stand alone. An engine lifting a single answer out of
 * context must still produce something correct, so each one repeats enough
 * subject to be self-contained rather than leaning on the question.
 */
export function faqSchema(
  faqs: readonly { question: string; answer: string }[],
  pageSlug: string,
) {
  return {
    "@type": "FAQPage",
    "@id": id(`${pageSlug}#faq`),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${appUrl()}${crumb.path}`,
    })),
  };
}

/** HowTo node, used by the verification and submission walkthroughs. */
export function howToSchema(input: {
  name: string;
  description: string;
  slug: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@type": "HowTo",
    "@id": id(`${input.slug}#howto`),
    name: input.name,
    description: input.description,
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Wraps nodes in a single @graph.
 *
 * One script tag per page holding a connected graph beats several disconnected
 * blobs: the shared @id references let an engine resolve author, publisher and
 * breadcrumb to the same organisation without guessing.
 */
export function buildGraph(
  nodes: Record<string, unknown>[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
