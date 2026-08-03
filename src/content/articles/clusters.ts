import { BYLINE } from "@/content/authors";
import type { Article } from "@/content/types";

/**
 * Supporting cluster articles across interpretation, verification and
 * submission. Each targets one long-tail question and links back to its pillar.
 */
export const CLUSTER_ARTICLES: Article[] = [
  // ── Interpreting results ─────────────────────────────────────
  {
    slug: "purity-versus-net-peptide-content",
    category: "interpreting-results",
    pillar: "reading-a-certificate-of-analysis",
    title: "Purity Versus Net Peptide Content",
    metaTitle: "Peptide Purity vs Net Content: What's the Difference?",
    metaDescription:
      "Why a 99% pure peptide can contain 30% less peptide than the label claims, where the missing mass goes, and which assay answers which question.",
    excerpt:
      "Why a 99% pure sample can contain far less peptide than its label claims, and where the missing mass actually goes.",
    primaryQuestion:
      "What is the difference between peptide purity and net peptide content?",
    keywords: [
      "peptide purity vs content",
      "net peptide content",
      "peptide label claim accuracy",
      "peptide mass balance",
    ],
    authorSlug: BYLINE.analytical,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 7,
    related: [
      "reading-a-certificate-of-analysis",
      "rp-hplc-peptide-purity",
      "residual-solvents-explained",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "What is the difference between purity and net peptide content?",
        answer:
          "Purity asks what fraction of the detected material was the target compound, reported as a percentage. Net peptide content asks how many milligrams of active peptide are in the vial, reported as a mass. A sample can score 99% on the first and fall 30% short on the second, because purity does not penalise mass that the detector cannot see.",
        paragraphs: [
          "This single distinction accounts for more disputes between buyers and suppliers than every other analytical disagreement combined.",
        ],
      },
      {
        kind: "prose",
        heading: "Where the missing mass goes",
        paragraphs: [
          "Lyophilised peptide is rarely pure peptide by mass. Residual water is present in every hygroscopic cake. Counter-ions, usually trifluoroacetate or acetate from purification, are chemically paired to basic residues and can account for a substantial fraction of dry weight. Bulking agents such as mannitol are sometimes added deliberately.",
          "None of that registers as impurity on a chromatogram, because none of it absorbs meaningfully at the detection wavelength or elutes inside the integration window.",
          "So a vial labelled 10 mg can contain 10 mg of powder that is 99% pure by HPLC, of which perhaps 7.5 mg is actually peptide. Both numbers are true. Only one tells you what you are dosing into an experiment.",
        ],
      },
      {
        kind: "table",
        heading: "Which to order",
        columns: ["Your question", "Order", "Why"],
        rows: [
          [
            "Is this the right compound and is it clean?",
            "Purity and identity",
            "Answers composition without quantifying mass",
          ],
          [
            "Is the label mass accurate?",
            "Net peptide content",
            "The only assay that quantifies active peptide per vial",
          ],
          [
            "I am calibrating an experiment",
            "Net peptide content",
            "Dosing by powder mass introduces error you cannot see",
          ],
          [
            "I resell this material",
            "All three",
            "Lets you make your own label claim rather than repeating a supplier's",
          ],
        ],
      },
    ],
    faqs: [
      {
        question: "Is 99% purity good if net content is only 75%?",
        answer:
          "Those figures are not in conflict and both can be accurate. The purity result says the peptide present is clean, with few related impurities. The content result says the powder is only three-quarters peptide by mass, the remainder being water, counter-ions and any bulking agent. For qualifying a synthesis route the purity figure is reassuring. For dosing an experiment the content figure is the one that matters.",
      },
      {
        question: "How is net peptide content measured?",
        answer:
          "By quantitative HPLC against a certified reference standard of known concentration. The sample response is compared to the standard curve, which converts a detector signal into an absolute mass rather than a relative percentage. Amino acid analysis is an alternative reference method, hydrolysing the peptide and quantifying the constituent amino acids, and is sometimes used to qualify the standard itself.",
      },
    ],
  },

  {
    slug: "chromatogram-basics",
    category: "interpreting-results",
    pillar: "reading-a-certificate-of-analysis",
    title: "Reading the Chromatogram Behind Your Result",
    metaTitle: "How to Read a Peptide HPLC Chromatogram",
    metaDescription:
      "Peak shape, baseline behaviour and shoulder peaks: what the raw HPLC trace shows about a peptide that a purity percentage cannot.",
    excerpt:
      "Peak shape, baseline drift and shoulders: what the raw trace shows that a purity percentage cannot.",
    primaryQuestion: "How do you read an HPLC chromatogram?",
    keywords: [
      "read HPLC chromatogram",
      "peptide chromatogram interpretation",
      "peak tailing shoulder",
      "chromatogram baseline",
    ],
    authorSlug: BYLINE.analytical,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 7,
    related: [
      "rp-hplc-peptide-purity",
      "reading-a-certificate-of-analysis",
      "what-does-not-detected-mean",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How do you read an HPLC chromatogram?",
        answer:
          "Look at three things in order. Peak symmetry: a fronting or tailing main peak signals column overload or a chemistry problem and distorts integration. Baseline stability: drift or noise inflates or deflates small impurity peaks depending on how integration was drawn. Shoulders: a bulge on the main peak usually means a closely related impurity that integration may have folded into the main result.",
        paragraphs: [
          "The purity percentage is a summary of this trace. The trace is the evidence, and it carries information the summary discards.",
        ],
      },
      {
        kind: "prose",
        heading: "Retention time is a weak identifier",
        paragraphs: [
          "Retention time tells you when something eluted, not what it was. Two different compounds can co-elute under one gradient and separate cleanly under another.",
          "This is precisely why chromatographic purity is paired with mass-spectrometric identity rather than identity being inferred from where a peak appeared. A peak in the expected place is consistent with the expected molecule; it is not proof of it.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does a shoulder on the main peak mean?",
        answer:
          "Usually a closely related impurity co-eluting with the target, most often a deamidation product, an oxidation product, or a deletion sequence missing one residue. These are chemically similar enough to the target that they bind the column almost identically. The practical concern is that integration software may fold the shoulder into the main peak, inflating the reported purity figure, which is why the trace should be reviewed rather than only the number.",
      },
    ],
  },

  {
    slug: "what-does-not-detected-mean",
    category: "interpreting-results",
    pillar: "reading-a-certificate-of-analysis",
    title: "What 'Not Detected' Means on a Lab Report",
    metaTitle: "What Does 'Not Detected' Mean on a Lab Report?",
    metaDescription:
      "Why 'not detected' never means zero, how limits of detection and quantitation differ, and what a certificate should state alongside the result.",
    excerpt:
      "Why 'not detected' never means zero, and what a certificate must state for the result to mean anything.",
    primaryQuestion: "Does 'not detected' mean zero?",
    keywords: [
      "not detected lab report",
      "limit of detection quantitation",
      "LOD LOQ meaning",
      "below detection limit",
    ],
    authorSlug: BYLINE.analytical,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 5,
    related: [
      "reading-a-certificate-of-analysis",
      "icp-ms-heavy-metals",
      "residual-solvents-explained",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "Does 'not detected' mean zero?",
        answer:
          "No. It means the analyte was below the method's limit of detection. Every analytical method has a threshold below which it cannot distinguish signal from noise, and that threshold is never zero. A certificate reporting 'not detected' should state the limit, because not detected at 50 parts per million and not detected at 2 parts per million are very different claims.",
        paragraphs: [
          "Reading the phrase as absence rather than as below-threshold is one of the three classic misreadings of a laboratory report.",
        ],
      },
      {
        kind: "definition",
        term: "Limit of detection and limit of quantitation",
        definition:
          "The limit of detection is the lowest concentration distinguishable from background noise. The limit of quantitation is the lowest concentration that can be measured with acceptable accuracy and precision.",
        expansion:
          "The quantitation limit is always higher than the detection limit. A result between the two means the analyte is present but the number attached to it is unreliable, which is why such results are usually reported as detected below quantitation limit rather than given a value.",
      },
    ],
    faqs: [
      {
        question: "What is the difference between LOD and LOQ?",
        answer:
          "The limit of detection is the lowest concentration at which the method can tell the analyte is present at all, conventionally where signal is about three times background noise. The limit of quantitation is the lowest concentration at which a number can be assigned with acceptable accuracy and precision, conventionally around ten times noise. Between the two, presence is real but the measured value is not trustworthy.",
      },
    ],
  },

  // ── Verification ─────────────────────────────────────────────
  {
    slug: "spotting-a-fake-coa",
    category: "verification",
    pillar: "how-coa-verification-works",
    title: "How to Spot a Fake Certificate of Analysis",
    metaTitle: "How to Spot a Fake Certificate of Analysis",
    metaDescription:
      "Seven checks that expose a fabricated or altered peptide Certificate of Analysis, from batch mismatches to missing method details and unverifiable references.",
    excerpt:
      "Seven checks that expose a fabricated or altered certificate, most of which take under a minute.",
    primaryQuestion: "How can you tell if a Certificate of Analysis is fake?",
    keywords: [
      "fake certificate of analysis",
      "fake COA peptide",
      "verify lab report authentic",
      "altered certificate analysis",
    ],
    authorSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 8,
    related: [
      "how-coa-verification-works",
      "certificate-hash-explained",
      "reading-a-certificate-of-analysis",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How can you tell if a Certificate of Analysis is fake?",
        answer:
          "Verify the certificate number with the issuing laboratory directly. If it does not resolve, the laboratory did not issue it. Short of that, check whether the batch number matches your material, whether methods and detection limits are stated, whether a named analyst signed it, and whether the laboratory named on it exists independently of the seller who gave it to you.",
        paragraphs: [
          "Most fabricated certificates fail on details their author considered decorative rather than load-bearing.",
        ],
      },
      {
        kind: "steps",
        heading: "Seven checks",
        steps: [
          {
            name: "Verify the reference",
            text: "Scan the QR code or enter the certificate number on the laboratory's own site. This settles the question outright when a verification facility exists.",
          },
          {
            name: "Match the batch number",
            text: "Compare against the vial in your hand. A genuine certificate attached to different material is the most common deception, because nothing about the document is forged.",
          },
          {
            name: "Look for stated methods",
            text: "A real report names the method, the detection wavelength and the limits. Fabrications state results without the conditions that produced them.",
          },
          {
            name: "Check for a named signatory",
            text: "Genuine certificates carry a named analyst and a role. Unattributed approval is a warning sign.",
          },
          {
            name: "Confirm the laboratory exists",
            text: "Search for it independently of whoever sent you the document. A laboratory with no presence beyond the certificate is not a laboratory.",
          },
          {
            name: "Question implausible precision",
            text: "Results like exactly 99.9% on every batch, or identical figures across different lots, describe a template rather than a measurement.",
          },
          {
            name: "Check the dates",
            text: "An issue date preceding the manufacture date, or a certificate older than the batch it describes, indicates reuse.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        heading: "The most common fraud is not forgery",
        body: "It is attaching a real certificate to material it never covered. Nothing on the document is altered, so every visual check passes. Only matching the batch number against the vial, and verifying the certificate with the issuing laboratory, catches it.",
      },
    ],
    faqs: [
      {
        question: "Can I trust a COA a peptide vendor sends me?",
        answer:
          "Treat it as a claim to be verified rather than as evidence in itself. The document may be entirely genuine, but it arrives from the party with a commercial interest in you believing it, and it carries no intrinsic proof of authenticity. If it names an independent laboratory and carries a certificate number, verify it directly with that laboratory. If it cannot be verified independently, it establishes only what the seller is willing to assert.",
      },
      {
        question: "What if the lab has no verification page?",
        answer:
          "Contact the laboratory directly, quoting the certificate number, and ask them to confirm they issued it and that the details match. A legitimate laboratory will confirm the existence and basic details of a certificate to somebody holding its reference, since that is the entire purpose of issuing references. An inability to reach the laboratory at all, or a refusal to confirm anything, is itself informative.",
      },
    ],
  },

  {
    slug: "certificate-hash-explained",
    category: "verification",
    pillar: "how-coa-verification-works",
    title: "What a Certificate Hash Proves",
    metaTitle: "Certificate Hash Verification Explained",
    metaDescription:
      "How a cryptographic certificate hash detects tampering in a Certificate of Analysis, what it proves, and what it deliberately does not prove.",
    excerpt:
      "How a cryptographic fingerprint detects tampering, and the narrow thing it actually proves.",
    primaryQuestion: "What is a certificate hash?",
    keywords: [
      "certificate hash",
      "COA tamper detection",
      "document integrity hash",
      "HMAC certificate verification",
    ],
    authorSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 6,
    related: ["how-coa-verification-works", "spotting-a-fake-coa"],
    blocks: [
      {
        kind: "answer",
        heading: "What is a certificate hash?",
        answer:
          "A certificate hash is a fixed-length fingerprint computed from a certificate's immutable fields and the document bytes at the moment of issue. Changing anything, a single digit of a purity result or one byte of the PDF, produces a completely different hash. Comparing the hash displayed by the issuing laboratory against the document you hold detects tampering.",
        paragraphs: [
          "The property that makes this work is that the function is one-way and collision-resistant: it is computationally infeasible to construct a different document producing the same fingerprint.",
        ],
      },
      {
        kind: "prose",
        heading: "What it does not prove",
        paragraphs: [
          "A hash proves integrity, not correctness. It demonstrates that a document has not changed since issue. It says nothing about whether the measurement behind it was competent, whether the sample was representative, or whether the laboratory was honest.",
          "It also does not prove the document is the current one. A certificate can be validly hashed and subsequently revoked, which is why verification checks status alongside integrity rather than treating a matching hash as sufficient.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can two different documents have the same hash?",
        answer:
          "Not in any practical sense with a modern hash function. Collisions are theoretically possible because the output is fixed-length while the input is not, but for functions such as SHA-256 no practical method exists to construct two meaningful documents sharing a fingerprint. The security assumption is computational infeasibility rather than mathematical impossibility, and that assumption holds comfortably for document integrity.",
      },
    ],
  },

  // ── Submission ───────────────────────────────────────────────
  {
    slug: "why-sterility-needs-its-own-vial",
    category: "submission",
    pillar: "third-party-peptide-testing",
    title: "Why Sterility and Endotoxin Need Dedicated Vials",
    metaTitle: "Why Sterility Testing Needs a Dedicated Vial",
    metaDescription:
      "The chain-of-custody reason sterility and endotoxin assays cannot share material with other tests, and how to plan vial counts for a submission.",
    excerpt:
      "The chain-of-custody reason these assays cannot share material, and how to count vials before shipping.",
    primaryQuestion: "Why do sterility and endotoxin tests need separate vials?",
    keywords: [
      "sterility test dedicated vial",
      "how many vials peptide testing",
      "endotoxin vial requirement",
      "peptide submission planning",
    ],
    authorSlug: BYLINE.microbiology,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 6,
    related: [
      "sterility-testing-usp-71",
      "endotoxin-testing-explained",
      "shipping-samples-to-the-lab",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "Why do sterility and endotoxin tests need separate vials?",
        answer:
          "Sterility asks whether viable organisms are present in a sealed container. The first entry for any other purpose makes the question unanswerable, because later growth cannot be attributed to the original contents rather than to the act of entry. Endotoxin is less sensitive to prior entry but acutely sensitive to handling contamination, so it also runs on a dedicated unit opened under controlled conditions.",
        paragraphs: [
          "Neither restriction is administrative. Both follow from what the assay is measuring.",
        ],
      },
      {
        kind: "steps",
        heading: "Counting vials for a submission",
        intro: "Add them in this order and the arithmetic stays simple.",
        steps: [
          {
            name: "Start with one",
            text: "Purity, identity, net content, elemental impurities and residual solvents can all share material drawn from a single vial.",
          },
          {
            name: "Add one for endotoxin",
            text: "If bacterial endotoxin testing is ordered, it consumes a dedicated unopened vial.",
          },
          {
            name: "Add one for sterility",
            text: "If sterility testing is ordered, it consumes another dedicated unopened vial.",
          },
          {
            name: "Add per-vial assays last",
            text: "Vial conformity inspection is billed per vial and applies to every unit shipped, including the dedicated ones.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "How many vials do I need for a full peptide test panel?",
        answer:
          "Three, for a panel covering purity, identity, net peptide content, bacterial endotoxins and sterility. One vial supplies all the chromatographic and mass-spectrometric work, one is consumed by endotoxin testing and one by sterility testing. Sending fewer means the microbiological assays cannot run, and a laboratory will normally hold the affected tests and contact you rather than substitute material.",
      },
    ],
  },

  {
    slug: "shipping-samples-to-the-lab",
    category: "submission",
    pillar: "third-party-peptide-testing",
    title: "Shipping Peptide Samples to a Laboratory",
    metaTitle: "How to Ship Peptide Samples for Testing",
    metaDescription:
      "Packaging, temperature, documentation and the customs declarations that most often delay an international peptide testing submission.",
    excerpt:
      "Packaging, temperature and the customs wording that decides whether your samples arrive next week or next month.",
    primaryQuestion: "How should peptide samples be shipped for testing?",
    keywords: [
      "shipping peptide samples",
      "peptide sample packaging",
      "customs declaration research chemicals",
      "send samples to lab",
    ],
    authorSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 6,
    related: [
      "why-sterility-needs-its-own-vial",
      "third-party-peptide-testing",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How should peptide samples be shipped for testing?",
        answer:
          "Ship crimped, unopened vials in rigid secondary packaging with absorbent material sufficient to contain the full liquid volume if a vial fails. Lyophilised material is stable at ambient temperature in transit; reconstituted material must ship cold and be declared as such. Include a printed copy of the order number inside the package.",
        paragraphs: [
          "Receiving matches physical samples to submissions by that order number. A package arriving without one is held until the sender can be identified, which routinely costs more time than the shipping itself.",
        ],
      },
      {
        kind: "prose",
        heading: "Customs declarations",
        paragraphs: [
          "Declare contents accurately as research chemical samples for laboratory analysis, with a nominal declared value.",
          "Do not describe samples as pharmaceuticals, supplements, or anything intended for human use. That description is inaccurate for research material and invites regulatory scrutiny that adds weeks. Understating or misdescribing contents is the single most common cause of a shipment being held, and a held shipment cannot be expedited once it is in a customs queue.",
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        heading: "Check the accepted scope before shipping",
        body: "Reputable laboratories decline human growth hormone, HCG, HMG, testosterone and related hormone preparations, along with cosmetic injectables of unverified origin. Samples outside accepted scope are declined at receiving and returned at the sender's cost, so confirm scope before paying for freight.",
      },
    ],
    faqs: [
      {
        question: "Do peptide samples need to ship cold?",
        answer:
          "Lyophilised peptide is stable at ambient temperature for the duration of normal transit and does not require cold shipping. Reconstituted material in solution does require cold-chain shipping and should be declared as temperature-sensitive so carriers handle it accordingly. If in doubt, ship lyophilised: it is more robust, cheaper to send, and avoids the degradation questions that arise when a cold chain is broken in transit.",
      },
    ],
  },
];
