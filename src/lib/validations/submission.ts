import { z } from "zod";
import { MAX_ADDITIONAL_COA_NAMES, TEST_CATALOG } from "@/lib/pricing";

/**
 * Sample submission schemas.
 *
 * Shared by the client form (per-step validation) and the server action (full
 * re-validation). The server never trusts a client-computed price — only the
 * test selections below are read, and totals are recomputed from them.
 */

const addressSchema = z.object({
  line1: z.string().trim().min(3, "Enter a street address."),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city."),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2, "Enter a postal or ZIP code."),
  country: z.string().trim().min(2, "Select a country."),
});

/**
 * Shape-only address, used for the billing block while it is inactive.
 *
 * Deliberately NOT `addressSchema.partial()`. `.partial()` permits a key to be
 * *absent*, but the form seeds billing with empty strings, and an empty string
 * is present — so `.partial()` would run `line1: min(3)` against `""` and fail.
 * Those failures would attach to billing fields that are hidden whenever
 * "same as shipping" is ticked, leaving the user on a form that refuses to
 * advance with nothing visibly wrong.
 *
 * Real billing validation happens in the superRefine below, and only when the
 * client has actually asked for a separate billing address.
 */
const inactiveAddressSchema = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })
  .optional();

export const contactStepSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, "Enter a company, organisation or your full name.")
      .max(160, "That name is too long."),
    contactPerson: z.string().trim().min(2, "Enter a contact name.").max(120),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address — your COA is sent here."),
    phone: z.string().trim().min(6, "Enter a contact phone number.").max(40),
    vatNumber: z.string().trim().max(60).optional().or(z.literal("")),
    marketingOptIn: z.boolean().default(false),
    shipping: addressSchema,
    /** When true, the billing address mirrors shipping. */
    billingSameAsShipping: z.boolean().default(true),
    billing: inactiveAddressSchema,
  })
  .superRefine((data, ctx) => {
    if (data.billingSameAsShipping) return;

    // A distinct billing address must be complete, not partially filled.
    const result = addressSchema.safeParse(data.billing ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["billing", ...issue.path],
          message: issue.message,
        });
      }
    }
  });

export type ContactStepInput = z.infer<typeof contactStepSchema>;

/**
 * One boolean per assay, built from the catalogue so adding a test to
 * `lib/pricing.ts` automatically extends validation.
 */
export const testSelectionSchema = z.object(
  Object.fromEntries(
    TEST_CATALOG.map((t) => [t.key, z.boolean().default(false)]),
  ) as Record<string, z.ZodDefault<z.ZodBoolean>>,
);

export const sampleSchema = z
  .object({
    productName: z.string().trim().min(2, "Enter the product name.").max(160),
    batchNumber: z.string().trim().min(1, "Enter a batch or lot number.").max(80),
    strength: z.string().trim().max(60).optional().or(z.literal("")),
    quantity: z
      .coerce.number()
      .int("Enter a whole number of vials.")
      .min(1, "At least one vial is required.")
      .max(500, "Contact the lab for submissions above 500 vials."),
    expectedPeptide: z.string().trim().max(160).optional().or(z.literal("")),
    tests: testSelectionSchema,
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Photography is free and cannot be the only thing ordered — there would be
    // no analysis to certify.
    const billable = TEST_CATALOG.filter(
      (t) => t.key !== "photo" && data.tests[t.key],
    );
    if (billable.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tests"],
        message: "Select at least one analysis for this sample.",
      });
    }
  });

export type SampleInput = z.infer<typeof sampleSchema>;

export const samplesStepSchema = z.object({
  samples: z
    .array(sampleSchema)
    .min(1, "Add at least one sample.")
    .max(200, "Contact the lab directly for orders above 200 sample lines."),
  combineOnSingleCoa: z.boolean().default(true),
  isExpedited: z.boolean().default(false),
  additionalCoaNames: z
    .array(z.string().trim().max(160))
    .max(
      MAX_ADDITIONAL_COA_NAMES,
      `A maximum of ${MAX_ADDITIONAL_COA_NAMES} additional company names is supported.`,
    )
    .default([]),
  specialInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SamplesStepInput = z.infer<typeof samplesStepSchema>;

export const reviewStepSchema = z.object({
  paymentMethod: z.enum(["INVOICE", "CARD", "BANK_TRANSFER"], {
    errorMap: () => ({ message: "Choose how you would like to pay." }),
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({
      message: "You must confirm the research-use-only declaration.",
    }),
  }),
  confirmVialCondition: z.literal(true, {
    errorMap: () => ({
      message: "Confirm your samples ship in crimped, unopened vials.",
    }),
  }),
});

export type ReviewStepInput = z.infer<typeof reviewStepSchema>;

/**
 * Full submission validator.
 *
 * Composed by re-running the three step schemas rather than merging them, which
 * keeps every `superRefine` rule (billing completeness, at-least-one-assay)
 * active on the server.
 */
export const fullSubmissionSchema = z
  .object({})
  .passthrough()
  .superRefine((raw, ctx) => {
    for (const schema of [
      contactStepSchema,
      samplesStepSchema,
      reviewStepSchema,
    ] as const) {
      const result = schema.safeParse(raw);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: issue.path,
            message: issue.message,
          });
        }
      }
    }
  })
  .transform((raw) => {
    // Safe: superRefine above guarantees all three parse cleanly.
    const contact = contactStepSchema.parse(raw);
    const samples = samplesStepSchema.parse(raw);
    const review = reviewStepSchema.parse(raw);
    return { ...contact, ...samples, ...review };
  });

export type FullSubmissionInput = z.infer<typeof fullSubmissionSchema>;

/** Blank sample used when the form adds a new row. */
export function emptySample(): SampleInput {
  return {
    productName: "",
    batchNumber: "",
    strength: "",
    quantity: 1,
    expectedPeptide: "",
    notes: "",
    tests: {
      purity: true,
      identity: true,
      content: false,
      sterility: false,
      endotoxin: false,
      heavyMetals: false,
      residualSolvents: false,
      conformity: false,
      photo: true,
    },
  } as SampleInput;
}
