/**
 * Knowledge-centre content model.
 *
 * Articles are typed data rather than MDX. Three reasons that matters here:
 *
 *  1. Every article carries the metadata the Article schema needs (author,
 *     reviewer, dates, section, keywords) as required fields, so it is not
 *     possible to publish a page that is invisible to an answer engine.
 *  2. Section blocks are discriminated unions, which lets the renderer emit the
 *     right markup for each kind of content. A definition block, a step list
 *     and a comparison table are different things to an extractor, and flat
 *     prose loses that distinction.
 *  3. Internal links are declared as slugs and validated at build time, so the
 *     cluster cannot silently develop orphan pages.
 */

export type ArticleCategory =
  | "interpreting-results"
  | "analytical-methods"
  | "verification"
  | "submission"
  | "quality-standards";

export interface Author {
  slug: string;
  name: string;
  role: string;
  credentials: string;
  /** Two or three sentences. Renders on every article they sign. */
  bio: string;
  expertise: string[];
}

/**
 * Content blocks.
 *
 * The `answer` variant exists specifically for answer engines: a self-contained
 * 40-to-60-word response to the question in the heading, placed immediately
 * after it. An extractor lifting only that paragraph should still produce
 * something correct and attributable.
 */
export type Block =
  | { kind: "prose"; heading: string; paragraphs: string[] }
  | {
      kind: "answer";
      heading: string;
      /** Self-contained. Must make sense with zero surrounding context. */
      answer: string;
      paragraphs: string[];
    }
  | { kind: "steps"; heading: string; intro?: string; steps: { name: string; text: string }[] }
  | {
      kind: "table";
      heading: string;
      intro?: string;
      columns: string[];
      rows: string[][];
      caption?: string;
    }
  | { kind: "callout"; tone: "note" | "warning"; heading: string; body: string }
  | { kind: "definition"; term: string; definition: string; expansion?: string };

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface Article {
  slug: string;
  category: ArticleCategory;
  /** H1 and og:title. Front-loads the primary term. */
  title: string;
  /** Meta title. Under 60 characters so it survives the SERP truncation. */
  metaTitle: string;
  /** Meta description. 140 to 158 characters. */
  metaDescription: string;
  /** One-sentence summary used on cards and in the article lede. */
  excerpt: string;
  /**
   * The question this page exists to answer, phrased the way a person would
   * type or say it. Drives the H1 pairing and the FAQ node.
   */
  primaryQuestion: string;
  keywords: string[];
  authorSlug: string;
  reviewerSlug?: string;
  datePublished: string;
  dateModified: string;
  readingMinutes: number;
  /** Slugs of related articles. Validated in content/index.ts. */
  related: string[];
  /** Pillar page this cluster article supports, if any. */
  pillar?: string;
  /** True for the four hub pages that anchor each cluster. */
  isPillar?: boolean;
  blocks: Block[];
  faqs: ArticleFaq[];
}

export const CATEGORY_META: Record<
  ArticleCategory,
  { label: string; description: string; slug: ArticleCategory }
> = {
  "interpreting-results": {
    slug: "interpreting-results",
    label: "Interpreting Results",
    description:
      "How to read a Certificate of Analysis, what each number means, and the errors that make a good report look like a bad one.",
  },
  "analytical-methods": {
    slug: "analytical-methods",
    label: "Analytical Methods",
    description:
      "The instrumentation behind each result: chromatography, mass spectrometry, elemental analysis and microbiology, explained without hand-waving.",
  },
  verification: {
    slug: "verification",
    label: "Certificate Verification",
    description:
      "How certificate verification works, why a document alone proves nothing, and how to detect an altered or fabricated report.",
  },
  submission: {
    slug: "submission",
    label: "Submission Guidance",
    description:
      "Planning a submission: which assays answer which question, how many vials to send, and how to ship without losing weeks to customs.",
  },
  "quality-standards": {
    slug: "quality-standards",
    label: "Quality & Standards",
    description:
      "Compendial methods, validation, accreditation and what independence actually requires of a testing laboratory.",
  },
};
