/**
 * Single source of truth for the LAVA Diagnostics price list.
 *
 * This module is imported by BOTH the browser (to render the live order
 * summary) and the server action that persists an order. The server always
 * recomputes totals from the submitted test selections and ignores any amount
 * sent by the client, so a tampered payload cannot change what is charged.
 *
 * All amounts are integer cents.
 */

export type TestKey =
  | "purity"
  | "identity"
  | "content"
  | "sterility"
  | "endotoxin"
  | "heavyMetals"
  | "residualSolvents"
  | "conformity"
  | "photo";

export interface TestDefinition {
  key: TestKey;
  label: string;
  shortLabel: string;
  /** Instrument or method shown alongside the price. */
  method: string;
  priceCents: number;
  /** Billed for every vial rather than once per sample line. */
  perVial?: boolean;
  /** Consumes a dedicated vial that cannot be used for other assays. */
  requiresExtraVial?: boolean;
  description: string;
  turnaround: string;
}

export const TEST_CATALOG: readonly TestDefinition[] = [
  {
    key: "purity",
    label: "Purity",
    shortLabel: "Purity",
    method: "RP-HPLC / UV-DAD",
    priceCents: 20_000,
    description:
      "Reverse-phase gradient separation with diode-array detection. Reports main-peak area percent and resolves related substances down to 0.05% area.",
    turnaround: "3-5 business days",
  },
  {
    key: "identity",
    label: "Identity Confirmation",
    shortLabel: "Identity",
    method: "LC-MS (ESI-QTOF)",
    priceCents: 15_000,
    description:
      "Monoisotopic mass confirmation against the theoretical sequence mass, with charge-state deconvolution and mass-accuracy reporting in ppm.",
    turnaround: "3-5 business days",
  },
  {
    key: "content",
    label: "Net Peptide Content",
    shortLabel: "Content",
    method: "Quantitative HPLC vs. reference standard",
    priceCents: 12_500,
    description:
      "Absolute mass of active peptide per vial, quantified against a certified reference standard. Distinguishes label claim from net peptide delivered.",
    turnaround: "4-6 business days",
  },
  {
    key: "sterility",
    label: "Sterility",
    shortLabel: "Sterility",
    method: "USP <71> membrane filtration",
    priceCents: 15_000,
    requiresExtraVial: true,
    description:
      "14-day incubation across two growth media for aerobic, anaerobic and fungal recovery. Consumes a dedicated unopened vial.",
    turnaround: "16-18 business days",
  },
  {
    key: "endotoxin",
    label: "Bacterial Endotoxins",
    shortLabel: "Endotoxin",
    method: "USP <85> kinetic chromogenic LAL",
    priceCents: 17_500,
    requiresExtraVial: true,
    description:
      "Quantitative endotoxin burden in EU/mg with positive product control to demonstrate absence of assay inhibition or enhancement.",
    turnaround: "5-7 business days",
  },
  {
    key: "heavyMetals",
    label: "Elemental Impurities",
    shortLabel: "Heavy Metals",
    method: "ICP-MS, USP <232>/<233>",
    priceCents: 10_000,
    description:
      "Class 1 and Class 2A elemental impurities - lead, arsenic, cadmium, mercury, plus catalytic residues - quantified to sub-ppb detection limits.",
    turnaround: "5-7 business days",
  },
  {
    key: "residualSolvents",
    label: "Residual Solvents",
    shortLabel: "Residual Solvents",
    method: "GC-HS-FID, USP <467>",
    priceCents: 13_500,
    description:
      "Static headspace screen for Class 1 and Class 2 synthesis solvents including acetonitrile, DMF, TFA-associated residues and methanol.",
    turnaround: "5-7 business days",
  },
  {
    key: "conformity",
    label: "Vial Conformity",
    shortLabel: "Conformity",
    method: "Dimensional & closure inspection",
    priceCents: 5_000,
    perVial: true,
    description:
      "Fill volume, closure integrity, crimp seal and cake appearance assessed per vial against your specification.",
    turnaround: "2-3 business days",
  },
  {
    key: "photo",
    label: "Documented Vial Photography",
    shortLabel: "Photo",
    method: "Calibrated macro imaging",
    priceCents: 0,
    description:
      "High-resolution as-received imaging of the vial, label and lyophilised cake, appended to the Certificate of Analysis at no charge.",
    turnaround: "Included",
  },
] as const;

export const TEST_BY_KEY: Record<TestKey, TestDefinition> = Object.fromEntries(
  TEST_CATALOG.map((t) => [t.key, t]),
) as Record<TestKey, TestDefinition>;

/** Surcharge applied to the whole order when expedited processing is chosen. */
export const EXPEDITE_SURCHARGE_PERCENT = 20;

/** Charge per sample, per extra company name a COA must also be issued under. */
export const ADDITIONAL_COA_CENTS = 5_000;

/** Maximum extra company names permitted on one order. */
export const MAX_ADDITIONAL_COA_NAMES = 4;

/**
 * Volume tiers, evaluated highest-first. `minSamples` counts sample lines,
 * not vials.
 */
export const VOLUME_TIERS: readonly { minSamples: number; percent: number }[] = [
  { minSamples: 20, percent: 10 },
  { minSamples: 10, percent: 5 },
] as const;

export function volumeDiscountPercent(sampleCount: number): number {
  for (const tier of VOLUME_TIERS) {
    if (sampleCount >= tier.minSamples) return tier.percent;
  }
  return 0;
}

/** The shape the pricing engine needs from a sample. */
export interface PriceableSample {
  quantity: number;
  tests: Partial<Record<TestKey, boolean>>;
}

export interface PriceableOrder {
  samples: PriceableSample[];
  isExpedited: boolean;
  /** Extra company names beyond the primary one. */
  additionalCoaNames: string[];
}

export interface SampleLineBreakdown {
  index: number;
  lineTotalCents: number;
  items: { key: TestKey; label: string; qty: number; amountCents: number }[];
}

export interface PriceBreakdown {
  lines: SampleLineBreakdown[];
  sampleCount: number;
  /** Sum of all sample line totals, before order-level adjustments. */
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  expediteCents: number;
  additionalCoaCents: number;
  totalCents: number;
  /** Vials the client must ship, including dedicated vials for USP assays. */
  requiredVials: number;
}

function sampleRequiredVials(sample: PriceableSample): number {
  const base = Math.max(1, sample.quantity || 1);
  const dedicated = TEST_CATALOG.filter(
    (t) => t.requiresExtraVial && sample.tests[t.key],
  ).length;
  return base + dedicated;
}

/**
 * Computes an order total.
 *
 * Order of operations matters and is deliberate:
 *   1. sum sample line items
 *   2. apply the volume discount to that subtotal
 *   3. apply the expedite surcharge to the *discounted* subtotal
 *   4. add per-sample additional-COA fees, which are never discounted
 */
export function priceOrder(order: PriceableOrder): PriceBreakdown {
  const lines: SampleLineBreakdown[] = order.samples.map((sample, index) => {
    const vials = Math.max(1, sample.quantity || 1);
    const items: SampleLineBreakdown["items"] = [];

    for (const test of TEST_CATALOG) {
      if (!sample.tests[test.key]) continue;
      const qty = test.perVial ? vials : 1;
      items.push({
        key: test.key,
        label: test.label,
        qty,
        amountCents: test.priceCents * qty,
      });
    }

    return {
      index,
      lineTotalCents: items.reduce((sum, i) => sum + i.amountCents, 0),
      items,
    };
  });

  const sampleCount = order.samples.length;
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

  const discountPercent = volumeDiscountPercent(sampleCount);
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const discountedSubtotal = subtotalCents - discountCents;

  const expediteCents = order.isExpedited
    ? Math.round((discountedSubtotal * EXPEDITE_SURCHARGE_PERCENT) / 100)
    : 0;

  const extraNames = order.additionalCoaNames.filter(
    (n) => n.trim().length > 0,
  ).length;
  const additionalCoaCents =
    extraNames * sampleCount * ADDITIONAL_COA_CENTS;

  return {
    lines,
    sampleCount,
    subtotalCents,
    discountPercent,
    discountCents,
    expediteCents,
    additionalCoaCents,
    totalCents:
      discountedSubtotal + expediteCents + additionalCoaCents,
    requiredVials: order.samples.reduce(
      (sum, s) => sum + sampleRequiredVials(s),
      0,
    ),
  };
}

/** Vials required for a single sample line, for the live form hint. */
export function requiredVialsForSample(sample: PriceableSample): number {
  return sampleRequiredVials(sample);
}

/** Longest turnaround among the selected assays, for the estimate panel. */
export function estimatedTurnaround(order: PriceableOrder): string {
  const selected = new Set<TestKey>();
  for (const sample of order.samples) {
    for (const test of TEST_CATALOG) {
      if (sample.tests[test.key]) selected.add(test.key);
    }
  }
  if (selected.has("sterility")) return "16-18 business days";
  if (selected.has("content")) return "4-6 business days";
  if (
    selected.has("endotoxin") ||
    selected.has("heavyMetals") ||
    selected.has("residualSolvents")
  ) {
    return "5-7 business days";
  }
  if (selected.size > 0) return "3-5 business days";
  return "-";
}
