import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageSquare, Phone, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoleculeBackground } from "@/components/shared/molecule-background";
import { Reveal } from "@/components/shared/motion";
import { ContactForm } from "@/app/(marketing)/contact/contact-form";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact the Laboratory",
  description:
    "Speak to an analyst about method suitability, sample requirements, turnaround or a formal quotation.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <MoleculeBackground className="opacity-40 dark:opacity-25" />
        <div className="container relative py-20 sm:py-28">
          <Reveal className="max-w-3xl">
            <Badge variant="primary" size="lg" className="mb-7">
              <MessageSquare aria-hidden />
              Contact
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-6xl">
              Talk to an analyst, not a support queue
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Technical questions about method suitability, sample requirements or
              interpreting a result are answered by the people who run the
              instruments.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight">
              Send us a message
            </h2>
            <p className="mt-2.5 text-[15px] text-muted-foreground">
              All fields marked with an asterisk are required.
            </p>
            <div className="mt-9">
              <ContactForm />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="space-y-6">
            <Card className="p-7">
              <p className="overline mb-6">Direct contact</p>
              <dl className="space-y-5">
                <div className="flex gap-3.5">
                  <Mail
                    className="mt-0.5 size-4 shrink-0 text-lava-500"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <dt className="text-[13px] text-muted-foreground">Email</dt>
                    <dd className="mt-0.5">
                      <a
                        href={`mailto:${BRAND.email}`}
                        className="break-words font-medium transition-colors hover:text-lava-600 dark:hover:text-lava-400"
                      >
                        {BRAND.email}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <Phone
                    className="mt-0.5 size-4 shrink-0 text-lava-500"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[13px] text-muted-foreground">Phone</dt>
                    <dd className="mt-0.5">
                      <a
                        href={`tel:${BRAND.phone.replace(/[^\d+]/g, "")}`}
                        className="font-medium transition-colors hover:text-lava-600 dark:hover:text-lava-400"
                      >
                        {BRAND.phone}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <Clock
                    className="mt-0.5 size-4 shrink-0 text-lava-500"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[13px] text-muted-foreground">
                      Laboratory hours
                    </dt>
                    <dd className="mt-0.5 font-medium">{BRAND.hours}</dd>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-lava-500"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[13px] text-muted-foreground">
                      Sample shipping address
                    </dt>
                    <dd className="mt-1 text-[15px] font-medium leading-relaxed">
                      {BRAND.name}
                      <br />
                      {BRAND.address.line1}
                      <br />
                      {BRAND.address.line2}
                      <br />
                      {BRAND.address.city}, {BRAND.address.state}{" "}
                      {BRAND.address.postalCode}
                      <br />
                      {BRAND.address.country}
                    </dd>
                  </div>
                </div>
              </dl>

              <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                Always include your order number inside the package. Shipments
                without one are held until the sender can be identified.
              </p>
            </Card>

            <Card className="bg-muted/45 p-7">
              <h3 className="text-base font-semibold tracking-tight">
                Checking a certificate?
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                You do not need to contact us to confirm a certificate is
                genuine. Enter its number or scan its QR code and you will get an
                answer immediately.
              </p>
              <Button variant="outline" className="mt-5 w-full" asChild>
                <Link href="/verify">
                  <ScanLine aria-hidden />
                  Verify a Certificate
                </Link>
              </Button>
            </Card>

            <Card className="border-lava-200 bg-lava-50/55 p-7 dark:border-lava-900/70 dark:bg-lava-950/25">
              <h3 className="text-base font-semibold tracking-tight">
                Before you ship
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                We cannot accept HGH, HCG, HMG, testosterone or related hormone
                preparations, nor cosmetic injectables of unverified origin.
                Samples outside our scope are declined at receiving and returned
                at the sender&apos;s cost.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  );
}
