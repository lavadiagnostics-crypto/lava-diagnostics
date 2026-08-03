import { BYLINE } from "@/content/authors";
import type { Article } from "@/content/types";

/**
 * Analytical-methods cluster.
 *
 * Each article answers one question completely rather than surveying a topic.
 * That shape is deliberate: an answer engine extracting a passage needs a
 * self-contained response, and a reader arriving from a long-tail query wants
 * their specific question settled, not a tour.
 */
export const METHOD_ARTICLES: Article[] = [
  {
    slug: "rp-hplc-peptide-purity",
    category: "analytical-methods",
    pillar: "peptide-testing-methods-explained",
    title: "RP-HPLC Purity Testing for Peptides",
    metaTitle: "RP-HPLC Peptide Purity Testing Explained",
    metaDescription:
      "How reverse-phase HPLC measures peptide purity, what main-peak area percent means, why detection wavelength matters, and how to read the chromatogram.",
    excerpt:
      "How reverse-phase HPLC measures purity, what the percentage actually represents, and why the detection wavelength changes the answer.",
    primaryQuestion: "How does RP-HPLC measure peptide purity?",
    keywords: [
      "RP-HPLC peptide purity",
      "peptide purity testing",
      "HPLC purity analysis",
      "main peak area percent",
    ],
    authorSlug: BYLINE.analytical,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 8,
    related: [
      "chromatogram-basics",
      "purity-versus-net-peptide-content",
      "peptide-testing-methods-explained",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How does RP-HPLC measure peptide purity?",
        answer:
          "RP-HPLC pushes a dissolved sample through a hydrophobic column while a solvent gradient changes. Components bind with different strengths and emerge at different times. A UV detector, usually at 214 nanometres, records each as a peak. Purity is the main peak's area expressed as a percentage of the total integrated peak area.",
        paragraphs: [
          "The measurement is relative, not absolute. It describes the proportion of what the detector saw, which is the single most misunderstood property of the number.",
        ],
      },
      {
        kind: "prose",
        heading: "Why the detection wavelength changes the answer",
        paragraphs: [
          "The peptide bond absorbs strongly at around 214 nanometres, so detection there responds to essentially any peptide regardless of sequence.",
          "Detection at 280 nanometres responds only to aromatic residues: tryptophan, tyrosine and phenylalanine. A peptide lacking all three is nearly invisible at that wavelength, and an impurity lacking them will not register even if it is present in quantity.",
          "This is why a purity figure without a stated wavelength is not directly comparable to another. Two laboratories can report honestly different numbers for the same vial.",
        ],
      },
      {
        kind: "prose",
        heading: "What purity does not capture",
        paragraphs: [
          "Anything that does not absorb at the detection wavelength contributes no peak area and therefore no penalty. Residual water, acetate and trifluoroacetate counter-ions, and bulking agents such as mannitol all fall into that category.",
          "Anything eluting outside the integration window is also excluded. Very polar species can appear in the void volume and very hydrophobic species may not elute within the gradient at all.",
          "The consequence is that a 99% pure sample can be materially short on peptide mass. Purity and net peptide content are different assays answering different questions.",
        ],
      },
      {
        kind: "callout",
        tone: "note",
        heading: "Read the peak shape, not just the number",
        body: "A sharply fronting or badly tailing main peak suggests column overload or a chemistry problem and can distort integration in either direction. A shoulder on the main peak usually indicates a closely related impurity, often a deamidation or oxidation product, that naive integration will fold into the main peak and report as purity.",
      },
    ],
    faqs: [
      {
        question: "What does 98% purity by HPLC actually mean?",
        answer:
          "It means the main peak accounted for 98% of the total integrated peak area at the stated detection wavelength. It does not mean the vial is 98% peptide by mass, and it does not mean 2% of the contents are impurities. Material that does not absorb at the detection wavelength, including water, counter-ions and bulking agents, contributes no area and is therefore invisible to the measurement.",
      },
      {
        question: "Why do two labs report different purity for the same peptide?",
        answer:
          "Most commonly because they used different detection wavelengths, different gradients or different integration parameters. Purity at 214 nanometres and purity at 280 nanometres are genuinely different measurements of the same vial. Gradient slope affects whether closely eluting impurities resolve into separate peaks or merge into the main peak. Neither laboratory is necessarily wrong, which is why methods should be stated on the certificate.",
      },
    ],
  },

  {
    slug: "lc-ms-peptide-identity",
    category: "analytical-methods",
    pillar: "peptide-testing-methods-explained",
    title: "LC-MS Identity Confirmation for Peptides",
    metaTitle: "LC-MS Peptide Identity Confirmation Explained",
    metaDescription:
      "How LC-MS confirms peptide identity by matching monoisotopic mass, what ppm accuracy means, and why mass confirmation cannot distinguish sequence isomers.",
    excerpt:
      "How mass spectrometry confirms identity, what ppm accuracy means, and the one thing a mass match cannot tell you.",
    primaryQuestion: "How does LC-MS confirm peptide identity?",
    keywords: [
      "LC-MS peptide identity",
      "peptide mass confirmation",
      "monoisotopic mass peptide",
      "ESI-QTOF peptide",
    ],
    authorSlug: BYLINE.analytical,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 7,
    related: [
      "rp-hplc-peptide-purity",
      "peptide-testing-methods-explained",
      "reading-a-certificate-of-analysis",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How does LC-MS confirm peptide identity?",
        answer:
          "LC-MS separates the sample chromatographically, then ionises each component and measures its mass-to-charge ratio. For peptides, electrospray ionisation produces a series of multiply charged ions, which deconvolution converts into a single neutral mass. That observed monoisotopic mass is compared against the theoretical mass of the claimed sequence and the difference reported in parts per million.",
        paragraphs: [
          "A match within a few ppm confirms the molecular formula is consistent with the claimed sequence. On a well-calibrated instrument, agreement inside 5 ppm is routine.",
        ],
      },
      {
        kind: "prose",
        heading: "What a mass match cannot exclude",
        paragraphs: [
          "Mass is a property of composition, not of order. Two peptides containing the same amino acids arranged differently have identical molecular formulas and therefore identical masses.",
          "Intact mass confirmation cannot distinguish them. Neither can it reliably distinguish isobaric residue substitutions such as leucine for isoleucine, which are exactly equal in mass.",
          "When sequence certainty genuinely matters, the correct assay is peptide mapping: enzymatic digestion followed by tandem mass spectrometry of the resulting fragments, which reconstructs the order rather than only the composition.",
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        heading: "Identity and purity are independent",
        body: "A sample can produce a single sharp chromatographic peak at 99.5% purity and still be the wrong molecule. Purity describes how much of one thing is present. Identity describes what that thing is. Ordering purity alone answers neither question completely.",
      },
    ],
    faqs: [
      {
        question: "What is a good ppm mass accuracy for peptide identity?",
        answer:
          "On a modern QTOF instrument with recent calibration, agreement between observed and theoretical monoisotopic mass within 5 parts per million is routine and within 2 ppm is common. A result outside 10 ppm on such an instrument warrants investigation, either of the sample or of the calibration. Certificates should report the observed mass, the theoretical mass and the difference, rather than only stating that identity was confirmed.",
      },
      {
        question: "Can LC-MS tell the difference between two peptides with the same mass?",
        answer:
          "Not from intact mass alone. Peptides containing the same amino acids in a different order share a molecular formula and therefore a mass, and substitutions such as leucine for isoleucine are exactly isobaric. Distinguishing them requires peptide mapping, where the peptide is enzymatically digested and the fragments analysed by tandem mass spectrometry to reconstruct the actual sequence.",
      },
    ],
  },

  {
    slug: "icp-ms-heavy-metals",
    category: "analytical-methods",
    pillar: "peptide-testing-methods-explained",
    title: "ICP-MS Heavy Metal Testing for Peptides",
    metaTitle: "ICP-MS Heavy Metal Testing for Peptides",
    metaDescription:
      "How ICP-MS quantifies lead, arsenic, cadmium and mercury in research peptides under USP 232 and 233, and where elemental impurities come from.",
    excerpt:
      "How ICP-MS quantifies elemental impurities to sub-ppb limits, and where the contamination usually originates.",
    primaryQuestion: "How are heavy metals tested in research peptides?",
    keywords: [
      "ICP-MS heavy metals peptide",
      "elemental impurities USP 232",
      "peptide heavy metal testing",
      "lead arsenic cadmium mercury peptide",
    ],
    authorSlug: BYLINE.analytical,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 7,
    related: [
      "peptide-testing-methods-explained",
      "residual-solvents-explained",
      "third-party-peptide-testing",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How are heavy metals tested in research peptides?",
        answer:
          "The sample is destroyed by microwave-assisted acid digestion, then introduced into an argon plasma at roughly 7,000 kelvin which atomises and ionises every element present. A mass spectrometer counts the resulting ions per element. Detection limits reach sub-parts-per-billion, and the procedure follows USP chapters 232 and 233 for elemental impurity limits.",
        paragraphs: [
          "Because digestion destroys the sample, this assay cannot share material with anything requiring an intact unit.",
        ],
      },
      {
        kind: "prose",
        heading: "Where elemental impurities come from",
        paragraphs: [
          "Rarely from the peptide itself. The usual sources are upstream of the molecule.",
          "Catalytic residues enter during synthesis, most often palladium from coupling chemistry. Leachables enter from processing equipment, container closures and stoppers. Reagent-grade solvents and salts carry trace metals of their own, which concentrate during lyophilisation.",
          "Class 1 elements, meaning lead, arsenic, cadmium and mercury, carry the strictest limits because they have no useful role and meaningful toxicity at low exposure. Class 2A elements including cobalt, nickel and vanadium are also routinely screened.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why would a research peptide contain heavy metals?",
        answer:
          "Almost never from the peptide sequence itself. Contamination typically enters from catalytic residues used during synthesis such as palladium, from leachables in processing equipment and container closures, or from trace metals present in reagent-grade solvents and salts that become concentrated during lyophilisation. Screening exists because these routes are common rather than exotic.",
      },
    ],
  },

  {
    slug: "endotoxin-testing-explained",
    category: "analytical-methods",
    pillar: "peptide-testing-methods-explained",
    title: "Bacterial Endotoxin Testing Explained",
    metaTitle: "Bacterial Endotoxin Testing for Peptides (USP 85)",
    metaDescription:
      "How kinetic chromogenic LAL measures bacterial endotoxin in peptides under USP 85, what EU/mg means, and why a dedicated vial is required.",
    excerpt:
      "How the LAL assay quantifies endotoxin burden, what EU per milligram means, and why the test needs its own vial.",
    primaryQuestion: "What is bacterial endotoxin testing?",
    keywords: [
      "bacterial endotoxin testing",
      "LAL test peptide",
      "USP 85 endotoxin",
      "endotoxin units per mg",
    ],
    authorSlug: BYLINE.microbiology,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 7,
    related: [
      "sterility-testing-usp-71",
      "why-sterility-needs-its-own-vial",
      "peptide-testing-methods-explained",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "What is bacterial endotoxin testing?",
        answer:
          "Endotoxin testing quantifies lipopolysaccharide from the outer membrane of Gram-negative bacteria. The kinetic chromogenic LAL method uses an enzyme cascade derived from horseshoe crab amoebocyte lysate, which endotoxin activates, releasing a coloured marker. The rate of colour development is proportional to endotoxin concentration, reported in endotoxin units per milligram.",
        paragraphs: [
          "Endotoxin is not a living organism, so it survives sterilisation. A sample can be perfectly sterile and still carry a high endotoxin burden, which is why the two assays are not substitutes for one another.",
        ],
      },
      {
        kind: "prose",
        heading: "Why the positive product control matters",
        paragraphs: [
          "Peptide samples can interfere with the LAL cascade, either inhibiting it and producing a falsely low result, or enhancing it and producing a falsely high one.",
          "A valid endotoxin test therefore includes a positive product control: a known quantity of endotoxin spiked into the sample matrix. If the spike recovers within the accepted range, the matrix is not interfering and the sample result is trustworthy.",
          "A certificate reporting an endotoxin figure without a positive product control has not demonstrated that the number means anything for that particular material.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between sterility and endotoxin testing?",
        answer:
          "Sterility testing asks whether viable organisms are present and capable of growing. Endotoxin testing quantifies a heat-stable bacterial cell-wall fragment that remains after the organisms are dead. Because endotoxin survives sterilisation, material can pass sterility and fail endotoxin. The two assays answer genuinely different questions and neither substitutes for the other.",
      },
      {
        question: "What does EU/mg mean on a certificate?",
        answer:
          "Endotoxin units per milligram of peptide. An endotoxin unit is a standardised measure of biological activity rather than of mass, calibrated against an international reference standard, because endotoxin potency varies with molecular structure. Expressing the result per milligram of peptide rather than per millilitre of solution makes results comparable across different reconstitution volumes.",
      },
    ],
  },

  {
    slug: "sterility-testing-usp-71",
    category: "analytical-methods",
    pillar: "peptide-testing-methods-explained",
    title: "Sterility Testing Under USP <71>",
    metaTitle: "USP 71 Sterility Testing Explained",
    metaDescription:
      "How USP 71 membrane filtration sterility testing works, why incubation takes 14 days, and what a passing sterility result does and does not cover.",
    excerpt:
      "How membrane filtration sterility testing works, why it takes fourteen days, and what the result actually covers.",
    primaryQuestion: "How does USP <71> sterility testing work?",
    keywords: [
      "USP 71 sterility testing",
      "sterility test peptide",
      "membrane filtration sterility",
      "14 day incubation sterility",
    ],
    authorSlug: BYLINE.microbiology,
    reviewerSlug: BYLINE.quality,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 7,
    related: [
      "why-sterility-needs-its-own-vial",
      "endotoxin-testing-explained",
      "peptide-testing-methods-explained",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "How does USP <71> sterility testing work?",
        answer:
          "The contents of intact unopened units are dissolved and passed through a membrane filter fine enough to retain micro-organisms. The membrane is rinsed, divided, and transferred into two growth media: fluid thioglycollate for anaerobes and soybean casein digest for aerobes and fungi. Both are incubated for fourteen days and examined for growth.",
        paragraphs: [
          "The fourteen days are not laboratory scheduling. They are the incubation period the method requires, because slow-growing and stressed organisms may take that long to become visible.",
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        heading: "Sterility describes a sealed unit only",
        body: "A passing sterility result applies to the sealed container as tested. It is destroyed by the first non-aseptic entry, and no certificate can speak to what happened after the seal was broken. A vial that passed sterility in March and was opened on a bench in April is not sterile material with a certificate, it is opened material with a historical record.",
      },
    ],
    faqs: [
      {
        question: "Why does sterility testing take 14 days?",
        answer:
          "Because that is the incubation period the compendial method specifies. Some organisms grow slowly, and organisms stressed by lyophilisation or by the filtration process itself can take considerably longer to become visible than they would from a healthy culture. A shorter incubation would produce faster answers and a higher false-pass rate, which is why expedited processing cannot compress it.",
      },
      {
        question: "Can sterility testing be done on an opened vial?",
        answer:
          "No, not meaningfully. Sterility asks whether viable organisms are present in a sealed container. Once that container has been entered for any purpose, any subsequent growth cannot be attributed to the original contents rather than to the act of entry. A result from a previously sampled vial would be uninterpretable regardless of whether growth occurred.",
      },
    ],
  },

  {
    slug: "residual-solvents-explained",
    category: "analytical-methods",
    pillar: "peptide-testing-methods-explained",
    title: "Residual Solvent Testing for Peptides",
    metaTitle: "Residual Solvent Testing for Peptides (USP 467)",
    metaDescription:
      "How headspace GC-FID detects residual synthesis solvents in peptides under USP 467, which solvents matter, and why lyophilisation does not remove them all.",
    excerpt:
      "Which solvents survive synthesis and purification, how headspace GC detects them, and why drying does not remove everything.",
    primaryQuestion: "What are residual solvents in peptides?",
    keywords: [
      "residual solvents peptide",
      "USP 467 residual solvents",
      "GC headspace peptide",
      "acetonitrile TFA residue",
    ],
    authorSlug: BYLINE.analytical,
    datePublished: "2026-08-02",
    dateModified: "2026-08-02",
    readingMinutes: 6,
    related: [
      "icp-ms-heavy-metals",
      "peptide-testing-methods-explained",
      "purity-versus-net-peptide-content",
    ],
    blocks: [
      {
        kind: "answer",
        heading: "What are residual solvents in peptides?",
        answer:
          "Residual solvents are organic solvents left over from synthesis and purification that survive drying. In peptide manufacture the usual candidates are acetonitrile from chromatographic purification, dimethylformamide and dichloromethane from solid-phase synthesis, methanol, and trifluoroacetic acid associated residues. USP chapter 467 classifies them by toxicity and sets limits accordingly.",
        paragraphs: [
          "Detection uses static headspace gas chromatography with flame ionisation. The sample is heated in a sealed vial until volatiles partition into the gas above it, and that gas is injected rather than the sample itself.",
        ],
      },
      {
        kind: "prose",
        heading: "Why lyophilisation does not remove everything",
        paragraphs: [
          "Freeze-drying removes solvent that is free to sublime. Solvent bound within the lyophilised cake, coordinated to the peptide or trapped in the amorphous solid, does not leave so readily.",
          "Trifluoroacetate is the clearest example. It is not merely residual solvent but a counter-ion paired to basic residues, and it persists through drying because it is chemically associated with the molecule rather than simply mixed with it. Removing it requires deliberate salt exchange, not more drying.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why is TFA present in synthetic peptides?",
        answer:
          "Trifluoroacetic acid is used in solid-phase peptide synthesis for cleavage and deprotection, and again as a mobile-phase modifier during reverse-phase purification. Trifluoroacetate then pairs as a counter-ion with basic residues in the peptide. Because that association is chemical rather than physical, ordinary drying does not remove it, and material supplied as a TFA salt requires deliberate salt exchange if a different counter-ion is needed.",
      },
    ],
  },
];
