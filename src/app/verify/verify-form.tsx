"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { FileSearch, KeyRound, SearchX, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { QrScannerButton } from "@/app/verify/qr-scanner";
import { submitVerification } from "@/app/actions/verify";
import {
  verifyQuerySchema,
  type VerifyQueryInput,
} from "@/lib/validations/certificate";

/**
 * Verification search form.
 *
 * Deliberately has no "browse" or "recent certificates" affordance, and never
 * autocompletes from a list of real certificate numbers - there is no endpoint
 * that could supply one.
 */

type Outcome =
  | { kind: "none" }
  | { kind: "not_found" }
  | { kind: "code_required" }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "invalid"; message: string };

function formatRetry(seconds: number): string {
  if (seconds < 90) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minutes`;
  return `${Math.ceil(minutes / 60)} hours`;
}

export function VerifyForm({ initialQuery }: { initialQuery?: string }) {
  const [outcome, setOutcome] = React.useState<Outcome>({ kind: "none" });
  const [showCode, setShowCode] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<VerifyQueryInput>({
    resolver: zodResolver(verifyQuerySchema),
    defaultValues: {
      certificateNumber: initialQuery ?? "",
      verificationCode: "",
    },
  });

  async function onSubmit(values: VerifyQueryInput) {
    setOutcome({ kind: "none" });

    const result = await submitVerification(values);

    // A successful verification redirects server-side, so reaching here always
    // means the lookup did not resolve.
    switch (result.status) {
      case "NOT_FOUND":
        setOutcome({ kind: "not_found" });
        break;
      case "CODE_REQUIRED":
        setShowCode(true);
        setOutcome({ kind: "code_required" });
        break;
      case "RATE_LIMITED":
        setOutcome({
          kind: "rate_limited",
          retryAfterSeconds: result.retryAfterSeconds,
        });
        break;
      case "INVALID":
        setOutcome({ kind: "invalid", message: result.message });
        break;
      case "REDIRECT":
        break;
    }
  }

  return (
    <div>
      <Card className="p-7 sm:p-9">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <div>
            <Label htmlFor="certificateNumber">Certificate number</Label>
            <Input
              id="certificateNumber"
              className="mt-2 font-mono text-base tracking-tight"
              placeholder="LAVA-2026-000184"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="search"
              {...register("certificateNumber")}
            />
            <p className="mt-2 text-[13px] text-muted-foreground">
              Printed at the top of the certificate and on the vial label.
            </p>
          </div>

          <AnimatePresence initial={false}>
            {showCode ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  <Label htmlFor="verificationCode">Verification code</Label>
                  <Input
                    id="verificationCode"
                    className="mt-2 font-mono text-base tracking-tight"
                    placeholder="Paste the code from your certificate"
                    autoComplete="off"
                    spellCheck={false}
                    {...register("verificationCode")}
                  />
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Found beneath the QR code, or in the email that released this
                    certificate.
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isSubmitting}
            >
              {!isSubmitting ? <ShieldCheck aria-hidden /> : null}
              Verify
            </Button>
            <QrScannerButton />
          </div>

          {!showCode ? (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <KeyRound className="size-3.5" aria-hidden />
              I have a verification code instead
            </button>
          ) : null}
        </form>
      </Card>

      {/* ── Outcome ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {outcome.kind !== "none" ? (
          <motion.div
            key={outcome.kind}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6"
            role="status"
            aria-live="polite"
          >
            {outcome.kind === "not_found" ? (
              <Card className="border-destructive/35 bg-destructive/[0.045] p-7">
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <SearchX className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-destructive">
                      Certificate Not Found
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      No released certificate matches what you entered. Check the
                      reference for transcription errors - the letter O and the
                      digit 0 are the usual culprits.
                    </p>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      If the reference is definitely correct as printed, then we
                      did not issue this certificate. We maintain no unlisted or
                      private register that a genuine certificate could be hiding
                      in - a reference that does not resolve does not exist in our
                      records.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            {outcome.kind === "code_required" ? (
              <Card className="border-lava-300 bg-lava-50/60 p-7 dark:border-lava-900 dark:bg-lava-950/25">
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lava-600 shadow-subtle dark:bg-charcoal-900 dark:text-lava-400">
                    <KeyRound className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Verification code required
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      This laboratory requires the certificate number and its
                      verification code together. Enter the code printed beneath
                      the QR code, or scan the QR code instead.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            {outcome.kind === "rate_limited" ? (
              <Card className="border-[hsl(var(--pending)/0.4)] bg-[hsl(var(--pending)/0.06)] p-7">
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--pending)/0.13)] text-[hsl(var(--pending))]">
                    <ShieldAlert className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Too many verification attempts
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      Verification is rate-limited to protect our clients&apos;
                      certificates from bulk lookup. Please try again in about{" "}
                      {formatRetry(outcome.retryAfterSeconds)}.
                    </p>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      If you need to verify a number of certificates as part of a
                      genuine audit, contact the laboratory and we will help
                      directly.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            {outcome.kind === "invalid" ? (
              <Card className="border-border p-7">
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <FileSearch className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Check your entry
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      {outcome.message}
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
