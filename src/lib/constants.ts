/** Static site content and brand constants. */

export const BRAND = {
  name: "LAVA Diagnostics",
  shortName: "LAVA",
  tagline: "Independent Third-Party Laboratory Testing",
  domain: "lavadiagnostics.com",
  email: "support@lavadiagnostics.com",
  // No public telephone number: enquiries are handled by email so that every
  // technical answer is written down and attributable. Removing `phone` here
  // is what takes it off the contact page and the footer.
  address: {
    line1: "Analytical Sciences Building",
    line2: "1400 Research Parkway, Suite 300",
    city: "Nashville",
    state: "TN",
    postalCode: "37209",
    country: "United States",
  },
  hours: "Monday – Friday, 08:00 – 18:00 CT",
} as const;

export const MAIN_NAV = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/knowledge-base", label: "Knowledge Base" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_NAV = [
  {
    title: "Laboratory",
    links: [
      { href: "/services", label: "Analytical Services" },
      { href: "/pricing", label: "Pricing & Turnaround" },
      { href: "/about", label: "Accreditation & Methods" },
      { href: "/knowledge-base", label: "Knowledge Base" },
    ],
  },
  {
    title: "Clients",
    links: [
      { href: "/submit", label: "Submit Samples" },
      { href: "/verify", label: "Verify a Certificate" },
      { href: "/dashboard", label: "Client Portal" },
      { href: "/contact", label: "Contact the Lab" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/research-use", label: "Research Use Only" },
    ],
  },
] as const;

/** Home page capability cards. Each maps to a section on /services. */
export const SERVICE_CARDS = [
  {
    slug: "rp-hplc",
    title: "RP-HPLC",
    subtitle: "Purity & related substances",
    description:
      "Gradient reverse-phase separation with diode-array detection. Resolves related substances to 0.05% area and reports main-peak purity against a validated method.",
    metric: "0.05%",
    metricLabel: "LOQ, area",
  },
  {
    slug: "lc-ms",
    title: "LC-MS",
    subtitle: "Identity confirmation",
    description:
      "Electrospray QTOF mass spectrometry confirms monoisotopic mass against the theoretical sequence, with charge-state deconvolution and ppm accuracy reporting.",
    metric: "< 5 ppm",
    metricLabel: "Mass accuracy",
  },
  {
    slug: "icp-ms",
    title: "ICP-MS",
    subtitle: "Elemental impurities",
    description:
      "USP <232>/<233> elemental impurity panel covering Class 1 and Class 2A elements plus catalytic residues, quantified to sub-ppb detection limits.",
    metric: "ppb",
    metricLabel: "Detection limit",
  },
  {
    slug: "sterility",
    title: "Sterility Testing",
    subtitle: "USP <71>",
    description:
      "Membrane filtration with a 14-day incubation across two growth media, covering aerobic, anaerobic and fungal recovery under validated aseptic technique.",
    metric: "14 days",
    metricLabel: "Incubation",
  },
  {
    slug: "endotoxin",
    title: "Endotoxin",
    subtitle: "USP <85> kinetic chromogenic",
    description:
      "Quantitative bacterial endotoxin determination in EU/mg, with positive product control demonstrating absence of assay inhibition or enhancement.",
    metric: "0.005 EU/mL",
    metricLabel: "Sensitivity",
  },
  {
    slug: "heavy-metals",
    title: "Heavy Metals",
    subtitle: "Lead, arsenic, cadmium, mercury",
    description:
      "Targeted quantification of the four heavy metals of greatest toxicological concern, with microwave digestion and matrix-matched calibration.",
    metric: "4 elements",
    metricLabel: "Core panel",
  },
  {
    slug: "residual-solvents",
    title: "Residual Solvents",
    subtitle: "USP <467>, GC-HS-FID",
    description:
      "Static headspace gas chromatography screening for Class 1 and Class 2 synthesis solvents, including acetonitrile, DMF, methanol and TFA-associated residues.",
    metric: "Class 1 & 2",
    metricLabel: "Coverage",
  },
  {
    slug: "purity-testing",
    title: "Net Content",
    subtitle: "Quantitative peptide assay",
    description:
      "Absolute active peptide mass per vial against a certified reference standard — the difference between what the label claims and what the vial delivers.",
    metric: "± 2%",
    metricLabel: "Repeatability",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Submit Samples",
    description:
      "Complete the online submission form. Choose your analyses per sample and receive an itemised estimate and order number instantly.",
  },
  {
    step: 2,
    title: "Ship Samples",
    description:
      "Send crimped, unopened vials to the laboratory quoting your order number. Every vial is photographed and inspected on arrival.",
  },
  {
    step: 3,
    title: "Laboratory Analysis",
    description:
      "Your samples are analysed on qualified instrumentation under documented methods, with full chain-of-custody from receipt to report.",
  },
  {
    step: 4,
    title: "Certificate Issued",
    description:
      "Results are reviewed and signed by a second analyst. Your Certificate of Analysis is released with a unique number and QR code.",
  },
  {
    step: 5,
    title: "Verify Online",
    description:
      "Anyone holding your certificate can confirm its authenticity instantly — scan the QR code or enter the certificate number.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "We moved our entire release testing programme to LAVA after a competitor's report failed to reconcile with our own retained samples. Two years on, every batch we have cross-checked has matched their numbers.",
    author: "Dr. Elena Marchetti",
    role: "Head of Quality",
    company: "Nordpeak Research Chemicals",
  },
  {
    quote:
      "The QR verification changed how our customers treat our documentation. They stopped asking whether the COA was real, because they can check it themselves in about four seconds.",
    author: "James Okonkwo",
    role: "Operations Director",
    company: "Helix Supply Group",
  },
  {
    quote:
      "What we value is the honesty. When a batch came back at 94% against a 99% label claim, LAVA reported 94% and gave us the chromatogram to prove it. That is exactly what an independent laboratory is for.",
    author: "Sarah Lindqvist",
    role: "Founder",
    company: "Meridian Peptide Labs",
  },
] as const;

export const FAQS = [
  {
    question: "Are you genuinely independent from any peptide supplier?",
    answer:
      "Yes. LAVA Diagnostics has no ownership stake in, and takes no commission from, any manufacturer, distributor or reseller of research peptides. We do not sell peptides. Our only commercial relationship with a client is the testing fee, and that fee is identical whether a sample passes or fails.",
  },
  {
    question: "What do I need to send you?",
    answer:
      "Send your samples in crimped, unopened vials. Some assays — sterility and bacterial endotoxins in particular — consume a dedicated vial and cannot share material with other tests, so the submission form tells you exactly how many vials to ship as you build your order.",
  },
  {
    question: "Whose name appears on the Certificate of Analysis?",
    answer:
      "Only the company, organisation or individual name you enter on the submission form, exactly as you enter it. We do not add our clients' customers, suppliers or any third party. If you need the same results issued under additional company names, you can request that during submission.",
  },
  {
    question: "How does certificate verification work?",
    answer:
      "Every certificate we issue carries a unique certificate number and a QR code. Scanning the QR code or entering the certificate number on our verification page returns that specific certificate. There is no public directory of certificates and no way to browse them — a certificate can only be retrieved by someone who already holds its number or QR code.",
  },
  {
    question: "What happens if a sample fails?",
    answer:
      "We report what we measured. A failing result is issued as a Certificate of Analysis marked FAIL, with the same supporting data as a passing one. We will not withdraw, amend or suppress a result because a client is unhappy with it, and we do not offer 'retesting until pass'. You are welcome to submit a fresh sample as a new order.",
  },
  {
    question: "Can you test HGH, HCG, testosterone or similar products?",
    answer:
      "No. We do not accept human growth hormone, HCG, HMG, testosterone or related hormone preparations, nor cosmetic injectables of unverified origin. Samples outside our accepted scope are declined at receiving and returned at the client's cost.",
  },
  {
    question: "How long does testing take?",
    answer:
      "Most chromatographic and mass-spectrometric work completes in three to five business days from receipt. Elemental impurities and endotoxin add five to seven days. Sterility is governed by its 14-day incubation and returns in sixteen to eighteen business days. Expedited processing moves your samples to the front of the queue for a 20% surcharge.",
  },
  {
    question: "Do you offer accredited testing?",
    answer:
      "Our methods are validated in accordance with ICH Q2(R2) and performed under a documented quality system. Where a compendial method exists — USP <71>, <85>, <232>/<233> and <467> — we follow it. Contact the laboratory directly for our current accreditation schedule and scope documentation.",
  },
] as const;

export const KNOWLEDGE_ARTICLES = [
  {
    slug: "reading-a-certificate-of-analysis",
    category: "Interpreting Results",
    title: "How to read a Certificate of Analysis",
    excerpt:
      "What each section of a COA actually tells you, which numbers matter, and the three most common ways a report is misread.",
    readingTime: "8 min",
    body: [
      {
        heading: "Start with what the document is not",
        paragraphs: [
          "A Certificate of Analysis is a record of what a laboratory measured, in one sample, on one day, using stated methods. It is not a guarantee about a batch it was not drawn from, and it is not a safety assessment. The most common error we see is a COA being presented as evidence about material it never touched.",
          "Check three things before you read a single result: the batch or lot number, the date of receipt, and the name of the party who submitted the sample. If the batch number on the certificate does not match the batch number on the vial in your hand, the document tells you nothing about that vial.",
        ],
      },
      {
        heading: "Purity is an area percentage, not a promise",
        paragraphs: [
          "Chromatographic purity is reported as the area of the main peak as a percentage of total integrated peak area, at a stated detection wavelength. A result of 99.2% means the main peak accounted for 99.2% of what the detector saw — it does not mean the vial is 99.2% peptide by mass.",
          "That distinction matters commercially. A sample can be 99% pure by HPLC and still contain far less peptide than the label claims, because the remaining mass is water, counter-ions, acetate or mannitol rather than impurity. Purity and net peptide content are different questions and need different assays.",
        ],
      },
      {
        heading: "Identity is a mass match, and it has tolerances",
        paragraphs: [
          "Identity confirmation compares the observed monoisotopic mass against the theoretical mass of the claimed sequence. A well-run LC-MS identity test reports the observed mass, the theoretical mass, and the difference in parts per million.",
          "A mass match confirms the molecular formula is consistent with the claim. It does not, on its own, exclude every isomer or every sequence rearrangement of identical composition. When sequence certainty matters, ask for peptide mapping rather than mass confirmation alone.",
        ],
      },
      {
        heading: "The three misreadings",
        paragraphs: [
          "First, treating purity as content — covered above, and by far the most consequential. Second, reading 'not detected' as 'zero': every method has a limit of quantitation, and 'not detected' means 'below that limit', which the certificate should state. Third, assuming a passing sterility result applies to a vial that was opened after testing; sterility is destroyed by the first non-aseptic entry.",
        ],
      },
    ],
  },
  {
    slug: "purity-versus-net-peptide-content",
    category: "Analytical Methods",
    title: "Purity versus net peptide content",
    excerpt:
      "Why a 99% pure sample can contain 30% less peptide than its label claims, and which assay answers which question.",
    readingTime: "6 min",
    body: [
      {
        heading: "Two different measurements",
        paragraphs: [
          "Purity asks: of the material the detector saw, what fraction was the target compound? Net peptide content asks: how many milligrams of target compound are in this vial? A sample can score well on the first and poorly on the second, and this is the single largest source of disputes we adjudicate.",
        ],
      },
      {
        heading: "Where the missing mass goes",
        paragraphs: [
          "Lyophilised peptide is rarely pure peptide by mass. Residual water, trifluoroacetate or acetate counter-ions from purification, and bulking agents such as mannitol all contribute mass that HPLC purity does not penalise, because those components either do not absorb at the detection wavelength or elute outside the integration window.",
          "A vial labelled 10 mg can therefore contain 10 mg of powder that is 99% pure by HPLC, of which perhaps 7.5 mg is actually peptide. Both numbers are true. Only one of them tells you what you are dosing into an experiment.",
        ],
      },
      {
        heading: "Which to order",
        paragraphs: [
          "If you are qualifying a supplier or investigating a suspected substitution, order purity and identity. If you are calibrating an experiment, or your customers dose by mass, order net peptide content as well — it is the only result that quantifies the active substance per vial.",
          "For release testing on material you resell, we recommend all three. The combination is what lets you make a defensible label claim rather than repeating your supplier's.",
        ],
      },
    ],
  },
  {
    slug: "why-sterility-needs-its-own-vial",
    category: "Submission Guidance",
    title: "Why sterility and endotoxin need dedicated vials",
    excerpt:
      "The chain-of-custody reason certain assays cannot share material, and how to plan your submission around it.",
    readingTime: "5 min",
    body: [
      {
        heading: "The first entry ends sterility",
        paragraphs: [
          "A sterility test asks whether viable organisms are present in a sealed container. The moment a vial is entered for any other purpose — drawing material for HPLC, reconstituting for mass spectrometry — that question can no longer be answered, because any subsequent growth cannot be attributed to the original contents rather than the act of entry.",
          "This is why USP <71> is performed on intact, unopened units, and why a sterility result on a vial that was previously sampled for another assay would be scientifically meaningless regardless of the outcome.",
        ],
      },
      {
        heading: "Endotoxin has a related but distinct constraint",
        paragraphs: [
          "Bacterial endotoxin testing is less sensitive to prior entry than sterility, but it is acutely sensitive to contamination introduced during handling. Endotoxin is ubiquitous on ordinary labware and skin, so the assay is run on a dedicated vial opened under controlled conditions with depyrogenated consumables.",
        ],
      },
      {
        heading: "Planning your shipment",
        paragraphs: [
          "Count one vial for your chromatographic and spectrometric work, which can share material, then add one dedicated vial for sterility and one for endotoxin if you have ordered them. Our submission form does this arithmetic for you as you select assays, and states the total vial count before you confirm.",
          "Sending too few vials is the most common cause of delay on an otherwise complete order, because we will hold the affected assays and contact you rather than substitute material.",
        ],
      },
    ],
  },
  {
    slug: "verifying-a-certificate-is-genuine",
    category: "Certificate Verification",
    title: "Confirming a certificate is genuine",
    excerpt:
      "How QR verification and certificate hashing let you detect an altered or fabricated report.",
    readingTime: "4 min",
    body: [
      {
        heading: "A PDF proves nothing by itself",
        paragraphs: [
          "Any competent forger can reproduce a laboratory's letterhead, and editing a number in a PDF takes seconds. A certificate you were emailed by the party who benefits from its contents deserves independent confirmation.",
          "Every certificate LAVA issues carries a unique certificate number and a QR code that resolves to our verification page. What you see there is served from our database, not from the document in your hand — so if the two disagree, the document has been altered.",
        ],
      },
      {
        heading: "What verification tells you",
        paragraphs: [
          "A successful verification confirms four things: that we issued a certificate under that number, which party we issued it to, which product and batch it covers, and what result we recorded. It also displays a certificate hash — a fingerprint computed over the document's immutable fields and the PDF bytes at the moment of issue.",
          "If the certificate number returns nothing, we did not issue it. There is no public list of our certificates and no way to browse them, so a certificate that fails to verify is not merely 'unlisted' — it does not exist in our records.",
        ],
      },
      {
        heading: "Revoked certificates",
        paragraphs: [
          "Occasionally a certificate is withdrawn — a transcription error, a superseded revision, or material that was misidentified at receipt. A withdrawn certificate verifies as REVOKED with the reason shown, rather than disappearing. If you are shown a paper certificate that verifies as revoked, treat the paper as void.",
        ],
      },
    ],
  },
  {
    slug: "chromatogram-basics",
    category: "Interpreting Results",
    title: "Reading the chromatogram behind your result",
    excerpt:
      "Peak shape, baseline behaviour and shoulder peaks — what the raw trace shows that a purity percentage cannot.",
    readingTime: "7 min",
    body: [
      {
        heading: "Why we attach the trace",
        paragraphs: [
          "A purity percentage is a summary. The chromatogram is the evidence, and it carries information the summary cannot: whether the main peak is symmetrical, whether the baseline was stable, whether an apparently clean result is concealing a co-eluting shoulder.",
        ],
      },
      {
        heading: "What to look at first",
        paragraphs: [
          "Look at peak symmetry. A sharply fronting or badly tailing main peak suggests column overload or a chemistry problem, and can distort integration in either direction. Then look at the baseline before and after the main peak — drift or noise inflates or deflates small impurity peaks depending on how integration was drawn.",
          "Finally, look for shoulders. A shoulder on the main peak often indicates a closely related impurity, frequently a deamidation or oxidation product, that a naive integration will fold into the main peak and report as purity.",
        ],
      },
      {
        heading: "Retention time is a weak identifier",
        paragraphs: [
          "Retention time alone is not identity. Two different compounds can co-elute under one gradient and separate cleanly under another. This is precisely why we pair chromatographic purity with mass-spectrometric identity rather than inferring identity from where a peak appeared.",
        ],
      },
    ],
  },
  {
    slug: "shipping-samples-internationally",
    category: "Submission Guidance",
    title: "Shipping samples to the laboratory",
    excerpt:
      "Packaging, temperature, documentation and the customs details that most often delay an international submission.",
    readingTime: "6 min",
    body: [
      {
        heading: "Packaging",
        paragraphs: [
          "Ship crimped, unopened vials in rigid secondary packaging with enough absorbent material to contain the full liquid volume if a vial fails. Lyophilised material is robust at ambient temperature for transit; reconstituted material must ship cold and should be declared as such.",
          "Include a printed copy of your order number inside the package. Receiving matches physical samples to submissions by that number, and a package without one is held until we can identify the sender.",
        ],
      },
      {
        heading: "Documentation and customs",
        paragraphs: [
          "Declare contents accurately as research chemical samples for laboratory analysis, with no commercial value beyond a nominal declared amount. Understating or misdescribing contents is the most common cause of a shipment being held, and a held shipment cannot be expedited once it is in a customs queue.",
          "Do not describe samples as pharmaceuticals, supplements or anything intended for human use. That description is inaccurate for research material and invites regulatory scrutiny that will delay your results by weeks.",
        ],
      },
      {
        heading: "What we cannot accept",
        paragraphs: [
          "We decline human growth hormone, HCG, HMG, testosterone and related hormone preparations, and cosmetic injectables of unverified origin. We also decline opened or partially used vials for any assay where container integrity is part of the result. Declined samples are returned at the sender's cost.",
        ],
      },
    ],
  },
] as const;

/** Statistics shown on the home page and about page. */
export const LAB_STATS = [
  { value: "42,000+", label: "Samples analysed" },
  { value: "3–5", label: "Day standard turnaround" },
  { value: "0", label: "Peptides sold, ever" },
  { value: "100%", label: "Results reported as measured" },
] as const;

export const ACCEPTED_COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Ireland",
  "Germany",
  "France",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Spain",
  "Portugal",
  "Italy",
  "Denmark",
  "Sweden",
  "Norway",
  "Finland",
  "Poland",
  "Czech Republic",
  "Australia",
  "New Zealand",
  "Japan",
  "South Korea",
  "Singapore",
  "United Arab Emirates",
  "India",
  "Brazil",
  "Mexico",
  "South Africa",
  "Other",
] as const;

/** Products the laboratory will not accept, shown as a submission warning. */
export const EXCLUDED_PRODUCTS =
  "HGH, HCG, HMG, testosterone and related hormone preparations, and cosmetic injectables of unverified origin.";
