import type { Author } from "@/content/types";

/**
 * Bylines.
 *
 * Every knowledge-centre article is signed by a named analyst and, for anything
 * making a quantitative or safety-adjacent claim, countersigned by a reviewer.
 * This is the strongest E-E-A-T lever a technical publisher has: an engine
 * deciding whether to cite a page on endotoxin limits weighs a named person
 * with a stated role and credential far above an unattributed post.
 *
 * IMPORTANT BEFORE LAUNCH: these are placeholder profiles matching the roles
 * the laboratory needs to fill. Replace them with your real analysts before
 * publishing. Attributing technical content to people who do not exist is
 * exactly the kind of fabricated authority signal that gets a domain
 * discounted, and it is straightforwardly dishonest to readers relying on the
 * byline to judge the work.
 */
export const AUTHORS: Author[] = [
  {
    slug: "placeholder-analytical-lead",
    name: "REPLACE: Analytical Lead",
    role: "Head of Analytical Chemistry",
    credentials: "PhD Analytical Chemistry",
    bio: "Placeholder profile for the analyst who owns chromatographic and mass-spectrometric method development. Replace with the real person before launch.",
    expertise: [
      "RP-HPLC method development",
      "LC-MS identity confirmation",
      "ICH Q2(R2) method validation",
    ],
  },
  {
    slug: "placeholder-microbiology-lead",
    name: "REPLACE: Microbiology Lead",
    role: "Head of Microbiology",
    credentials: "MSc Microbiology",
    bio: "Placeholder profile for the analyst who owns sterility and bacterial endotoxin testing. Replace with the real person before launch.",
    expertise: [
      "USP <71> sterility testing",
      "USP <85> bacterial endotoxins",
      "Aseptic technique validation",
    ],
  },
  {
    slug: "placeholder-quality-manager",
    name: "REPLACE: Quality Manager",
    role: "Quality Manager",
    credentials: "Quality systems, ISO/IEC 17025",
    bio: "Placeholder profile for the reviewer who signs off certificates and owns the quality system. Replace with the real person before launch.",
    expertise: [
      "Certificate review and release",
      "Laboratory quality systems",
      "Chain of custody",
    ],
  },
];

export const AUTHOR_BY_SLUG: Record<string, Author> = Object.fromEntries(
  AUTHORS.map((a) => [a.slug, a]),
);

/** Convenience handles so articles do not repeat slug strings. */
export const BYLINE = {
  analytical: "placeholder-analytical-lead",
  microbiology: "placeholder-microbiology-lead",
  quality: "placeholder-quality-manager",
} as const;
