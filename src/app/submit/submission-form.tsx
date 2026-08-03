"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/app/submit/order-summary";
import { StepIndicator, SUBMISSION_STEPS } from "@/app/submit/step-indicator";
import { ContactStep } from "@/app/submit/steps/contact-step";
import { SamplesStep } from "@/app/submit/steps/samples-step";
import { ReviewStep } from "@/app/submit/steps/review-step";
import { createSubmission } from "@/app/actions/submission";
import { priceOrder, type PriceableOrder, type TestKey } from "@/lib/pricing";
import {
  contactStepSchema,
  emptySample,
  samplesStepSchema,
  type ContactStepInput,
  type ReviewStepInput,
  type SamplesStepInput,
} from "@/lib/validations/submission";

/**
 * The full submission form's value shape.
 *
 * All three steps live in ONE form instance rather than three. That way going
 * back never discards work, the live order summary can read across steps, and
 * the final payload is exactly what was validated.
 */
export type SubmissionFormValues = ContactStepInput &
  SamplesStepInput &
  Partial<ReviewStepInput> & {
    paymentMethod: ReviewStepInput["paymentMethod"];
  };

export interface SubmissionDefaults {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  shipping?: Partial<ContactStepInput["shipping"]>;
}

const EMPTY_ADDRESS = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function SubmissionForm({
  defaults,
  isAuthenticated,
}: {
  defaults?: SubmissionDefaults;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [completed, setCompleted] = React.useState<number[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<SubmissionFormValues>({
    mode: "onBlur",
    defaultValues: {
      companyName: defaults?.companyName ?? "",
      contactPerson: defaults?.contactPerson ?? "",
      email: defaults?.email ?? "",
      phone: defaults?.phone ?? "",
      vatNumber: defaults?.vatNumber ?? "",
      marketingOptIn: false,
      shipping: { ...EMPTY_ADDRESS, ...defaults?.shipping },
      billingSameAsShipping: true,
      billing: { ...EMPTY_ADDRESS },
      samples: [emptySample()],
      combineOnSingleCoa: true,
      isExpedited: false,
      additionalCoaNames: [],
      specialInstructions: "",
      paymentMethod: "INVOICE",
    },
  });

  const values = form.watch();

  /**
   * Live pricing.
   *
   * Recomputed on every render from the watched values - the calculation is
   * trivial arithmetic over a handful of samples, so memoising it would add more
   * complexity than it saves. The server recomputes this independently.
   */
  const priceable: PriceableOrder = {
    samples: (values.samples ?? []).map((sample) => ({
      quantity: Number(sample?.quantity) || 1,
      tests: (sample?.tests ?? {}) as Partial<Record<TestKey, boolean>>,
    })),
    isExpedited: Boolean(values.isExpedited),
    additionalCoaNames: values.additionalCoaNames ?? [],
  };
  const pricing = priceOrder(priceable);
  const sampleNames = (values.samples ?? []).map((s) => s?.productName ?? "");

  /** Scrolls the form back into view after a step change. */
  function scrollToTop() {
    document
      .getElementById("submission-top")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Validates only the current step before advancing.
   *
   * Each step is checked against its own schema so a user is never blocked by an
   * error on a step they have not reached yet.
   */
  async function goNext() {
    const current = form.getValues();

    if (step === 1) {
      const result = contactStepSchema.safeParse(current);
      if (!result.success) {
        // Surface every issue at once rather than one at a time.
        for (const issue of result.error.issues) {
          form.setError(issue.path.join(".") as never, {
            type: "manual",
            message: issue.message,
          });
        }
        /*
         * Name the first problem rather than saying "the highlighted fields".
         * An issue can land on a field that is currently hidden (the billing
         * block when "same as shipping" is ticked), and a generic message would
         * leave the user staring at a form with nothing visibly wrong.
         */
        toast.error(
          result.error.issues[0]?.message ??
            "Please complete the highlighted fields.",
        );
        return;
      }
    }

    if (step === 2) {
      const result = samplesStepSchema.safeParse(current);
      if (!result.success) {
        for (const issue of result.error.issues) {
          form.setError(issue.path.join(".") as never, {
            type: "manual",
            message: issue.message,
          });
        }
        toast.error(
          result.error.issues[0]?.message ??
            "Please complete your sample details.",
        );
        return;
      }
    }

    form.clearErrors();
    setCompleted((prev) => Array.from(new Set([...prev, step])));
    setStep((prev) => Math.min(SUBMISSION_STEPS.length, prev + 1));
    scrollToTop();
  }

  function goBack() {
    form.clearErrors();
    setStep((prev) => Math.max(1, prev - 1));
    scrollToTop();
  }

  function goToStep(target: number) {
    form.clearErrors();
    setStep(target);
    scrollToTop();
  }

  async function onSubmit() {
    const current = form.getValues();

    // The declarations live on step 3 and are the only fields not yet validated.
    if (current.acceptTerms !== true || current.confirmVialCondition !== true) {
      if (current.confirmVialCondition !== true) {
        form.setError("confirmVialCondition", {
          type: "manual",
          message: "Confirm your samples ship in crimped, unopened vials.",
        });
      }
      if (current.acceptTerms !== true) {
        form.setError("acceptTerms", {
          type: "manual",
          message: "You must confirm the research-use-only declaration.",
        });
      }
      toast.error("Please confirm both declarations before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createSubmission(current);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [path, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              form.setError(path as never, {
                type: "server",
                message: messages[0],
              });
            }
          }
        }
        toast.error(result.message ?? "We could not submit this order.");
        return;
      }

      // Hand off to the confirmation page, which owns the success state.
      router.push(`/submit/confirmation?order=${result.orderNumber}`);
    } catch (error) {
      console.error("[submit] unexpected failure", error);
      toast.error(
        "Something went wrong submitting your order. Nothing has been charged.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <div id="submission-top" className="scroll-mt-24">
        <StepIndicator
          currentStep={step}
          completedSteps={completed}
          onStepClick={goToStep}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10">
          {/* ── Step panel ── */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (step === SUBMISSION_STEPS.length) void onSubmit();
              else void goNext();
            }}
            noValidate
            className="min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 1 ? <ContactStep /> : null}
                {step === 2 ? <SamplesStep /> : null}
                {step === 3 ? <ReviewStep onEditStep={goToStep} /> : null}
              </motion.div>
            </AnimatePresence>

            {/* ── Navigation ── */}
            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={goBack}>
                  <ArrowLeft aria-hidden />
                  Back
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}

              {step < SUBMISSION_STEPS.length ? (
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  {step === 1 ? "Continue to samples" : "Review submission"}
                  <ArrowRight aria-hidden />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  className="w-full sm:w-auto"
                >
                  {!submitting ? <Send aria-hidden /> : null}
                  Submit order
                </Button>
              )}
            </div>

            {step === SUBMISSION_STEPS.length ? (
              <p className="mt-5 text-center text-[13px] leading-relaxed text-muted-foreground sm:text-left">
                Submitting generates your order number immediately. No payment is
                taken now.
                {!isAuthenticated ? (
                  <>
                    {" "}
                    We will create a client portal account for this email address
                    so you can track progress.
                  </>
                ) : null}
              </p>
            ) : null}
          </form>

          {/* ── Sticky summary ── */}
          <div className="lg:sticky lg:top-24">
            <OrderSummary
              pricing={pricing}
              order={priceable}
              sampleNames={sampleNames}
            />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
