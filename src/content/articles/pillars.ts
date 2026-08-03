import { BYLINE } from "@/content/authors";
import type { Article } from "@/content/types";

/**
 * Pillar pages.
 *
 * Each one is the hub of a cluster: broad enough to rank for the head term,
 * deep enough to be worth citing, and linked to every supporting article that
 * expands one of its sections. Cluster articles link back here, so authority
 * concentrates on four pages instead of scattering across thirty.
 */
export const PILLAR_ARTICLES: Article[] = [
  // ─────────────────────────────────────────────────────────────
  {
    slug: "third-party-peptide-testing",
    category: "quality-standards",
    isPillar: true,
    title: "Third-Party Peptide Testing: A Complete Guide",
    metaTitle: "Third-Party Peptide Testing: Complete Guide",
    metaDescription:
      "What independent peptide testing covers, which assays answer which question, what a Certificate of Analysis proves, and how to verify one is genuine.",
    excerpt:
      "What independent testing covers, which assay answers which question, and what a Certificate of Analysis can and cannot tell you.",
    primaryQuestion: "What is third-party peptide testing?",
    keywords: [
      "third party peptide testing",
      "peptide testing services",
      "independent peptide lab",
      "research peptide analysis",
      "peptide purity testing",
      "certificate of analysis peptides",
    ],
    authorSlug: BYLINE.analytical,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 14,
    related: [
      "purity-versus-net-peptide-content",
      "rp-hplc-peptide-purity",
      "lc-ms-peptide-identity",
      "reading-a-certificate-of-analysis",
      "how-coa-verification-works",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "What is third-party peptide testing?",
        answer:
          "Third-party peptide testing is analytical testing performed by a laboratory with no commercial interest in the result. The laboratory does not manufacture, distribute or sell the material it analyses, and is paid the same fee whether a sample passes or fails. It measures purity, confirms identity, quantifies active peptide content and screens for contamination, then issues a Certificate of Analysis recording what was measured.",
        paragraphs: [
          "The defining feature is not the instrumentation. A vendor's in-house laboratory can own the same chromatograph and the same mass spectrometer. The defining feature is the absence of a commercial stake in the outcome.",
          "That distinction is the entire reason the category exists. A certificate produced by the party selling the material answers a different question than the one a buyer is asking. It tells you what the seller is willing to publish, which is not the same as what the material contains.",
        ],
      },
      {
        kind: "prose",
        heading: "The four questions testing can answer",
        paragraphs: [
          "Laboratory work on a research peptide resolves into four distinct questions, and they need different assays. Conflating them is the most common and most expensive mistake buyers make.",
          "First: is it what the label says it is? That is an identity question, answered by mass spectrometry comparing observed monoisotopic mass against the theoretical mass of the claimed sequence.",
          "Second: how much of it is the target compound? That is purity, answered by chromatographic separation reporting main-peak area as a percentage of total integrated area.",
          "Third: how much active peptide is actually in the vial? That is net peptide content, answered by quantitative assay against a certified reference standard. It is a different number from purity and frequently a much less flattering one.",
          "Fourth: what else is in there? That is contamination, answered by a family of assays covering bacterial endotoxins, sterility, elemental impurities and residual solvents.",
        ],
      },
      {
        kind: "table",
        heading: "Which assay answers which question",
        intro:
          "Ordering the wrong test is the usual reason a report fails to settle the argument it was commissioned to settle.",
        columns: ["Question", "Assay", "Method", "Reports"],
        rows: [
          [
            "Is this the right molecule?",
            "Identity confirmation",
            "LC-MS (ESI-QTOF)",
            "Observed vs theoretical mass, ppm accuracy",
          ],
          [
            "How pure is it?",
            "Purity",
            "RP-HPLC with UV-DAD",
            "Main-peak area percent",
          ],
          [
            "How much peptide per vial?",
            "Net peptide content",
            "Quantitative HPLC vs reference standard",
            "Milligrams of active peptide",
          ],
          [
            "Is it endotoxin-free?",
            "Bacterial endotoxins",
            "Kinetic chromogenic LAL, USP <85>",
            "Endotoxin units per milligram",
          ],
          [
            "Is the sealed unit sterile?",
            "Sterility",
            "Membrane filtration, USP <71>",
            "Growth or no growth, 14 days",
          ],
          [
            "Any toxic metals?",
            "Elemental impurities",
            "ICP-MS, USP <232>/<233>",
            "Parts per billion per element",
          ],
          [
            "Any synthesis solvents left?",
            "Residual solvents",
            "GC-HS-FID, USP <467>",
            "Parts per million per solvent",
          ],
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        heading: "Purity and content are not the same number",
        body: "A sample can be 99% pure by HPLC and still contain 30% less peptide than the label claims. Purity measures the proportion of what the detector saw. Content measures absolute mass. Lyophilised peptide carries water, counter-ions and bulking agents that purity does not penalise. If you only order purity, you have not verified the label claim.",
      },
      {
        kind: "prose",
        heading: "What a Certificate of Analysis actually proves",
        paragraphs: [
          "A Certificate of Analysis is a record of what a laboratory measured, in one sample, on one day, using stated methods. That is the whole of it.",
          "It is not a guarantee about a batch the sample was not drawn from. It is not a safety assessment. It is not a regulatory clearance, and it does not indicate that material is suitable for administration to anything living.",
          "The most consequential misuse is presenting a certificate as evidence about material it never touched. Before reading a single result, check three things: the batch or lot number, the date of receipt, and the name of the party who submitted the sample. If the batch number on the certificate does not match the vial in your hand, the document tells you nothing about that vial.",
        ],
      },
      {
        kind: "prose",
        heading: "Why independence has to be structural",
        paragraphs: [
          "Independence is not a claim a laboratory can make about its intentions. It has to be structural, which means it should be checkable from the outside.",
          "The questions worth asking a prospective laboratory are concrete. Does it sell, manufacture, distribute or broker any of the material it tests? Does it take referral fees or commissions from suppliers? Does the fee change depending on the result? Will it issue a failing certificate with the same supporting data as a passing one? Does it offer retesting until pass?",
          "A laboratory that answers those questions evasively is telling you something useful.",
        ],
      },
      {
        kind: "prose",
        heading: "How verification closes the loop",
        paragraphs: [
          "Testing produces a document, and documents can be edited. Reproducing a laboratory letterhead is trivial, and changing a number in a PDF takes seconds.",
          "This is why a certificate worth anything carries a unique certificate number and a QR code resolving to the issuing laboratory's own records. What the verification page shows is served from the laboratory's database, not from the file in your hand. If the two disagree, the file has been altered.",
          "A well-built verification system also refuses to publish a browsable list of certificates. A directory would let anyone enumerate every client the laboratory has and every result it has ever issued, which is a confidentiality breach dressed up as transparency.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does third-party peptide testing cost?",
        answer:
          "Independent peptide testing is priced per assay rather than per sample. A purity and identity pair typically covers the basic question of whether material is what it claims to be. Adding quantitative net peptide content answers whether the label mass is accurate. Contamination panels including bacterial endotoxins, sterility, elemental impurities and residual solvents are priced separately because each consumes different instrumentation and, in the case of sterility and endotoxin, a dedicated unopened vial.",
      },
      {
        question: "How long does peptide testing take?",
        answer:
          "Chromatographic and mass-spectrometric work such as RP-HPLC purity and LC-MS identity typically completes in three to five business days from receipt. Quantitative net peptide content adds a day or two. Elemental impurities, residual solvents and bacterial endotoxins run five to seven business days. Sterility testing is governed by its fourteen-day incubation period and returns in sixteen to eighteen business days regardless of laboratory workload.",
      },
      {
        question: "Can a peptide vendor's own certificate be trusted?",
        answer:
          "A certificate produced or commissioned by the party selling the material answers a narrower question than a buyer usually assumes. It records what the seller was willing to publish. That may be entirely accurate, but it cannot be verified from the outside, and the commercial incentive runs one direction. Independent testing exists because the party with no stake in the result is the only one whose measurement is structurally unbiased.",
      },
      {
        question: "How many vials should be sent for testing?",
        answer:
          "Chromatographic and mass-spectrometric assays can share material from a single vial. Sterility testing and bacterial endotoxin testing each consume a dedicated unopened vial, because the questions they answer are destroyed by prior entry into the container. A submission ordering purity, identity, content, endotoxin and sterility therefore needs three vials, not one.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "reading-a-certificate-of-analysis",
    category: "interpreting-results",
    isPillar: true,
    title: "How to Read a Certificate of Analysis",
    metaTitle: "How to Read a Peptide Certificate of Analysis",
    metaDescription:
      "What each section of a peptide COA means, which numbers matter, and the three misreadings that cause most disputes between buyers and suppliers.",
    excerpt:
      "What each section of a COA tells you, which numbers matter, and the three most common ways a report gets misread.",
    primaryQuestion: "How do you read a peptide Certificate of Analysis?",
    keywords: [
      "how to read certificate of analysis",
      "peptide COA",
      "certificate of analysis peptide",
      "COA purity percentage",
      "interpret lab report peptide",
    ],
    authorSlug: BYLINE.analytical,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 11,
    related: [
      "purity-versus-net-peptide-content",
      "chromatogram-basics",
      "what-does-not-detected-mean",
      "third-party-peptide-testing",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How do you read a Certificate of Analysis?",
        answer:
          "Start with the header, not the results. Confirm the batch or lot number matches the material you hold, check the date of receipt, and note who submitted the sample. Then read purity as an area percentage, identity as a mass match in parts per million, and content as absolute milligrams. Purity and content are different measurements and are frequently confused.",
        paragraphs: [
          "A certificate is read from the top down for a reason. The header establishes what the document is about; the results establish what was found. Reading the results first is how people end up confidently quoting a purity figure for a batch the laboratory never received.",
        ],
      },
      {
        kind: "steps",
        heading: "Check the header before the results",
        intro:
          "Three fields decide whether the rest of the document is relevant to you at all.",
        steps: [
          {
            name: "Batch or lot number",
            text: "Must match the number on the vial in your hand. A certificate for batch B240612 says nothing about batch B240710, however similar the products look.",
          },
          {
            name: "Date of receipt",
            text: "Establishes when the laboratory took possession. A result describes the material as received on that date, not as it exists after months of uncontrolled storage.",
          },
          {
            name: "Submitting party",
            text: "Names who sent the sample. A certificate issued to a distributor covers the unit that distributor submitted, which may or may not represent what you were shipped.",
          },
        ],
      },
      {
        kind: "prose",
        heading: "Purity is an area percentage, not a promise",
        paragraphs: [
          "Chromatographic purity is reported as the area of the main peak expressed as a percentage of total integrated peak area, at a stated detection wavelength.",
          "A result of 99.2% means the main peak accounted for 99.2% of what the detector saw. It does not mean the vial is 99.2% peptide by mass, and it does not mean 0.8% of the contents are impurities.",
          "The distinction is commercially significant. A sample can be 99% pure by HPLC and contain far less peptide than the label claims, because the remaining mass is water, acetate or trifluoroacetate counter-ions, or mannitol, none of which absorb strongly at the detection wavelength or elute inside the integration window.",
        ],
      },
      {
        kind: "prose",
        heading: "Identity is a mass match with a tolerance",
        paragraphs: [
          "Identity confirmation compares the observed monoisotopic mass against the theoretical mass of the claimed sequence. A properly reported identity result states the observed mass, the theoretical mass, and the difference in parts per million.",
          "A mass match confirms the molecular formula is consistent with the claim. It does not, on its own, exclude every isomer or every sequence rearrangement of identical composition. Two peptides with the same amino acids in a different order have the same mass.",
          "When sequence certainty genuinely matters, the right assay is peptide mapping with tandem mass spectrometry, not intact mass confirmation.",
        ],
      },
      {
        kind: "prose",
        heading: "The three misreadings",
        paragraphs: [
          "The first and most consequential is treating purity as content. Covered above, and responsible for more supplier disputes than every other error combined.",
          "The second is reading 'not detected' as 'zero'. Every method has a limit of quantitation. Not detected means below that limit, and a certificate should state what the limit was. A residual solvent reported as not detected at a 50 ppm limit is a different claim from one not detected at 2 ppm.",
          "The third is assuming a passing sterility result still applies after the vial has been opened. Sterility describes a sealed unit. It is destroyed by the first non-aseptic entry, and no certificate can speak to what happened after the seal was broken.",
        ],
      },
      {
        kind: "callout",
        tone: "note",
        heading: "Ask for the chromatogram",
        body: "A purity percentage is a summary. The chromatogram is the evidence, and it carries information the summary cannot: whether the main peak is symmetrical, whether the baseline was stable, and whether an apparently clean result conceals a co-eluting shoulder. A laboratory that will not supply the trace behind a number is asking you to take the number on faith.",
      },
    ],
    faqs: [
      {
        question: "What purity percentage is good for a research peptide?",
        answer:
          "Most research applications treat 95% or higher by RP-HPLC as acceptable and 98% or higher as good, but the threshold depends entirely on the application. What matters more than the headline figure is whether the certificate states the detection wavelength, the gradient conditions and the limit of quantitation, and whether the chromatogram shows a symmetrical main peak without shoulders. A 99% figure from an undisclosed method is worth less than a 96% figure with full supporting data.",
      },
      {
        question: "Why does my peptide show high purity but low content?",
        answer:
          "Because purity and net peptide content measure different things. Purity is the proportion of the detected material that was the target compound. Content is the absolute mass of active peptide in the vial. Lyophilised peptide typically carries residual water, trifluoroacetate or acetate counter-ions from purification, and sometimes bulking agents such as mannitol. That mass is real but does not register as impurity on a chromatogram, so a vial can be simultaneously 99% pure and 25% short on its label claim.",
      },
      {
        question: "Does a Certificate of Analysis prove a peptide is safe?",
        answer:
          "No. A Certificate of Analysis records composition, not safety. It states what a laboratory measured in a specific sample using stated methods. It is not a safety assessment, an efficacy assessment, a regulatory clearance or an authorisation for human or veterinary use. A sample can be highly pure, correctly identified, sterile and endotoxin-free while remaining entirely unsuitable for administration to any living thing.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "how-coa-verification-works",
    category: "verification",
    isPillar: true,
    title: "How Certificate of Analysis Verification Works",
    metaTitle: "How COA Verification Works | Peptide Certificates",
    metaDescription:
      "How QR-code and certificate-number verification detects an altered or fabricated Certificate of Analysis, and why no genuine lab publishes a browsable COA list.",
    excerpt:
      "How QR and certificate-number verification let you detect an altered report, and why a public directory of certificates would be a confidentiality failure.",
    primaryQuestion: "How do you verify a Certificate of Analysis is genuine?",
    keywords: [
      "verify certificate of analysis",
      "COA verification",
      "fake certificate of analysis",
      "peptide COA verification",
      "QR code certificate verification",
    ],
    authorSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 9,
    related: [
      "spotting-a-fake-coa",
      "certificate-hash-explained",
      "reading-a-certificate-of-analysis",
      "third-party-peptide-testing",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How do you verify a Certificate of Analysis is genuine?",
        answer:
          "Scan the QR code printed on the certificate, or enter its certificate number on the issuing laboratory's verification page. What that page displays comes from the laboratory's own database rather than from the document you hold. If the two disagree on customer, product, batch or result, the document has been altered. If the reference returns nothing, the laboratory did not issue it.",
        paragraphs: [
          "The check takes a few seconds and requires no account, no relationship with the laboratory and no technical knowledge. That is deliberate. A verification system that only the certificate holder can use does not solve the problem, because the certificate holder is the party whose claim is in question.",
        ],
      },
      {
        kind: "prose",
        heading: "A PDF proves nothing by itself",
        paragraphs: [
          "Any competent forger can reproduce a laboratory's letterhead. Editing a number in a PDF takes seconds and leaves no visible trace.",
          "A certificate emailed to you by the party who benefits from its contents therefore deserves independent confirmation, not because that party is presumed dishonest, but because the document carries no intrinsic evidence of its own authenticity.",
        ],
      },
      {
        kind: "steps",
        heading: "What verification confirms",
        steps: [
          {
            name: "That the certificate exists",
            text: "The laboratory issued a certificate under that number. A reference that returns nothing was not issued by them.",
          },
          {
            name: "Who it was issued to",
            text: "The named party. A certificate issued to one company does not transfer to another company reselling the same batch.",
          },
          {
            name: "What it covers",
            text: "The specific product and batch number. This is what catches a genuine certificate being attached to different material.",
          },
          {
            name: "What was found",
            text: "The recorded result. If the PDF says 99.2% and the verification page says 94.1%, the PDF was edited.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        heading: "A genuine laboratory never publishes a browsable list",
        body: "If a testing laboratory offers a public directory of every certificate it has issued, that is a confidentiality failure, not a transparency feature. Such a list exposes every client relationship and every result to competitors. Verification should return exactly one certificate to somebody who already holds its reference, and nothing at all to somebody browsing.",
      },
      {
        kind: "prose",
        heading: "Revoked certificates should say so",
        paragraphs: [
          "Occasionally a certificate is withdrawn: a transcription error, a superseded revision, or material misidentified at receipt.",
          "A well-designed system verifies a withdrawn certificate as revoked, with the reason shown, rather than making it disappear. Deletion would leave anyone holding a printed copy unable to discover that it is void, which is the opposite of what a verification facility is for.",
          "If you are shown a paper certificate that verifies as revoked, treat the paper as void regardless of how recently it was handed to you.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does it mean if a certificate number returns nothing?",
        answer:
          "It means the laboratory has no record of issuing a certificate under that number. A properly built verification system has no unlisted or private register that a genuine certificate could be hiding in, so a reference that fails to resolve does not exist in that laboratory's records. Before concluding the document is fabricated, check the reference character by character, since the letter O against the digit zero and the letter I against the digit one account for most failed lookups.",
      },
      {
        question: "Can a QR code on a certificate be faked?",
        answer:
          "A QR code can be replaced with one pointing somewhere else, which is why the destination matters more than the code. Check that the URL you land on is the laboratory's actual domain rather than a lookalike, and that the page is served over HTTPS. A verification link that resolves to a domain you have never heard of, or to a page hosted by the seller rather than the laboratory, is not verification.",
      },
      {
        question: "Do I need an account to verify a certificate?",
        answer:
          "No. Verification is deliberately open to anyone holding a certificate number or QR code, because the people who most need to check a certificate are usually not the laboratory's clients. They are the downstream buyers, auditors and researchers being asked to rely on the document. A system that required an account would prevent exactly the people it exists to serve from using it.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "peptide-testing-methods-explained",
    category: "analytical-methods",
    isPillar: true,
    title: "Peptide Testing Methods Explained",
    metaTitle: "Peptide Testing Methods: HPLC, LC-MS, ICP-MS",
    metaDescription:
      "How RP-HPLC, LC-MS, ICP-MS, LAL endotoxin and USP sterility testing work on research peptides, what each measures, and when each one is the right assay.",
    excerpt:
      "How each instrument works, what it can measure, and where its limits are. Written for people commissioning the work, not operating it.",
    primaryQuestion: "What methods are used to test research peptides?",
    keywords: [
      "peptide testing methods",
      "RP-HPLC peptide",
      "LC-MS peptide analysis",
      "ICP-MS heavy metals",
      "peptide analytical methods",
      "USP 71 sterility",
    ],
    authorSlug: BYLINE.analytical,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 13,
    related: [
      "rp-hplc-peptide-purity",
      "lc-ms-peptide-identity",
      "icp-ms-heavy-metals",
      "endotoxin-testing-explained",
      "sterility-testing-usp-71",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "What methods are used to test research peptides?",
        answer:
          "Five method families cover research peptide analysis. RP-HPLC measures purity by separating components and comparing peak areas. LC-MS confirms identity by matching observed molecular mass to the claimed sequence. Quantitative HPLC against a reference standard measures net peptide content. ICP-MS quantifies elemental impurities. LAL and membrane filtration assess bacterial endotoxins and sterility respectively.",
        paragraphs: [
          "Each answers one question well and the others badly. Understanding which is which prevents the common situation where a buyer commissions an expensive panel that does not address the thing they were actually worried about.",
        ],
      },
      {
        kind: "definition",
        term: "RP-HPLC",
        definition:
          "Reverse-phase high-performance liquid chromatography separates the components of a sample by how strongly each binds to a hydrophobic column while a changing solvent gradient pushes them through.",
        expansion:
          "Components emerge at different times. A detector, usually ultraviolet at 214 nanometres where the peptide bond absorbs, records each as a peak. Purity is the main peak's area as a percentage of total integrated area. It is the workhorse assay for peptide quality control because it is quantitative, reproducible and resolves closely related impurities such as deletion and oxidation products.",
      },
      {
        kind: "definition",
        term: "LC-MS",
        definition:
          "Liquid chromatography coupled to mass spectrometry separates a sample chromatographically, then measures the mass-to-charge ratio of each component as it elutes.",
        expansion:
          "For peptides the instrument typically uses electrospray ionisation, which produces a series of multiply charged ions. Deconvolution converts that series into a single neutral mass, compared against the theoretical monoisotopic mass of the claimed sequence and reported as a difference in parts per million. A match within a few ppm confirms the molecular formula is consistent with the claim.",
      },
      {
        kind: "definition",
        term: "ICP-MS",
        definition:
          "Inductively coupled plasma mass spectrometry uses an argon plasma at roughly 7,000 kelvin to atomise and ionise a digested sample, then measures the resulting elemental ions.",
        expansion:
          "It reaches sub-parts-per-billion detection limits for most elements, which is why it is the reference method for the elemental impurity limits in USP chapters 232 and 233. The sample is destroyed during microwave acid digestion before analysis, so this assay cannot share material with anything requiring an intact sample.",
      },
      {
        kind: "table",
        heading: "Method comparison",
        columns: ["Method", "Measures", "Typical turnaround", "Consumes vial"],
        rows: [
          ["RP-HPLC", "Purity, related substances", "3 to 5 days", "Shared"],
          ["LC-MS", "Identity, molecular mass", "3 to 5 days", "Shared"],
          ["Quantitative HPLC", "Net peptide content", "4 to 6 days", "Shared"],
          ["ICP-MS", "Elemental impurities", "5 to 7 days", "Shared"],
          ["GC-HS-FID", "Residual solvents", "5 to 7 days", "Shared"],
          ["Kinetic chromogenic LAL", "Bacterial endotoxins", "5 to 7 days", "Dedicated"],
          ["Membrane filtration", "Sterility", "16 to 18 days", "Dedicated"],
        ],
        caption:
          "Assays marked shared can be run from material drawn from a single vial. Dedicated assays each require their own unopened unit.",
      },
      {
        kind: "prose",
        heading: "Why sterility and endotoxin need their own vials",
        paragraphs: [
          "A sterility test asks whether viable organisms are present in a sealed container. The moment that container is entered for any other purpose, the question becomes unanswerable: subsequent growth cannot be attributed to the original contents rather than to the act of entry.",
          "This is why the compendial method is performed on intact, unopened units, and why a sterility result on a previously sampled vial would be meaningless regardless of outcome.",
          "Endotoxin testing is less sensitive to prior entry but acutely sensitive to contamination introduced during handling. Endotoxin is ubiquitous on ordinary labware and skin, so the assay runs on a dedicated vial opened under controlled conditions with depyrogenated consumables.",
        ],
      },
      {
        kind: "prose",
        heading: "What method validation means",
        paragraphs: [
          "A method is not simply a procedure somebody follows. Under ICH Q2(R2), a quantitative method in routine use should have documented specificity, linearity, accuracy, precision, range and robustness.",
          "Specificity means the method measures the target and not something co-eluting with it. Linearity means the detector response scales predictably with concentration across the working range. Precision covers both repeatability within a run and intermediate precision across analysts and days.",
          "Where a compendial method exists, following it is not sufficient on its own either. USP chapter 1225 requires verification that the procedure performs as intended in that specific laboratory, on that instrumentation, with that sample matrix.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between HPLC and LC-MS for peptides?",
        answer:
          "HPLC separates components and measures how much of each is present, making it the appropriate method for purity. LC-MS separates components and measures the molecular mass of each, making it the appropriate method for identity. A peptide can pass HPLC purity while being the wrong molecule entirely, because a single sharp peak says nothing about what that peak is. The two assays are complementary rather than alternatives.",
        },
      {
        question: "Why is 214 nm used for peptide detection?",
        answer:
          "The peptide bond itself absorbs ultraviolet light strongly at around 214 nanometres, so detection at that wavelength responds to essentially any peptide regardless of sequence. Detection at 280 nanometres is also used but responds only to aromatic residues such as tryptophan, tyrosine and phenylalanine, which means a peptide lacking those residues would be nearly invisible. Certificates should state the detection wavelength, because purity figures at different wavelengths are not directly comparable.",
      },
      {
        question: "Can one vial be used for all peptide tests?",
        answer:
          "No. Chromatographic and mass-spectrometric assays including purity, identity, net content, elemental impurities and residual solvents can share material drawn from one vial. Sterility testing and bacterial endotoxin testing each require a dedicated unopened vial, because both answer questions about the sealed container that prior entry destroys. A full panel therefore requires a minimum of three vials.",
      },
    ],
  },
];
