import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Fingerprint, Gauge, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal } from "@/components/shared/motion";
import { VerifyForm } from "@/app/verify/verify-form";

export const metadata: Metadata = {
  title: "Verify a Certificate of Analysis",
  description:
    "Confirm that a LAVA Diagnostics Certificate of Analysis is genuine by entering its certificate number or scanning its QR code.",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

const GUARANTEES = [
  {
    icon: EyeOff,
    title: "No public directory",
    body: "There is no page that lists our certificates, and no endpoint that returns more than one. A certificate is reachable only by someone already holding its reference.",
  },
  {
    icon: Fingerprint,
    title: "Tamper-evident",
    body: "Every certificate carries a hash computed over its fields and the document itself at issue. Alter the PDF and it no longer matches what we show you here.",
  },
  {
    icon: Gauge,
    title: "Rate limited",
    body: "Lookups are throttled and repeated failures are locked out, so the register cannot be walked by guessing sequential numbers.",
  },
];

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Pre-fills the field when arriving from a link. Never performs the lookup
  // automatically - verification is always an explicit action.
  const { q } = await searchParams;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />
        <div className="container relative py-16 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="primary" size="lg" className="mb-7">
              <ShieldCheck aria-hidden />
              Certificate Verification
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-5xl">
              Verify a Certificate of Analysis
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Enter the certificate number, paste a verification code, or scan the
              QR code printed on the document. Results come straight from our
              records - not from the file in your hand.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="mx-auto max-w-xl">
          <VerifyForm initialQuery={q} />

          <Reveal className="mt-12" delay={0.12}>
            <div className="rule-fade" />
            <div className="mt-10 space-y-7">
              {GUARANTEES.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold tracking-tight">
                        {item.title}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal className="mt-12" delay={0.18}>
            <Card className="bg-muted/45 p-7">
              <h2 className="text-base font-semibold tracking-tight">
                Certificate will not verify?
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Check the reference character by character first - O against 0 and
                I against 1 account for most failed lookups. If it is definitely
                correct as printed, the certificate was not issued by us, and you
                should treat the document with suspicion.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Read more about{" "}
                <Link
                  href="/knowledge-base/verifying-a-certificate-is-genuine"
                  className="font-medium text-lava-600 underline-offset-4 hover:underline dark:text-lava-400"
                >
                  how verification works
                </Link>
                , or{" "}
                <Link
                  href="/contact"
                  className="font-medium text-lava-600 underline-offset-4 hover:underline dark:text-lava-400"
                >
                  contact the laboratory
                </Link>
                .
              </p>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  );
}
