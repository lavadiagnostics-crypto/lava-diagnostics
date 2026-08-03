import type { Metadata, Viewport } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { TooltipProvider } from "@/components/ui/misc";
import { BRAND } from "@/lib/constants";
import { appUrl } from "@/lib/env";
import "./globals.css";

/**
 * Type pairing.
 *
 * Instrument Sans is a slightly condensed grotesk with a tall x-height. It sets
 * dense technical copy at small sizes without the neutrality of the usual
 * default, and its tighter widths let long analytical headlines hold two lines
 * instead of three.
 *
 * IBM Plex Mono carries every number on the site: certificate references, batch
 * numbers, masses, purity percentages, hashes. Numerals are the load-bearing
 * content of a laboratory report, so they get a face designed to be compared
 * vertically rather than merely read.
 */
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: `${BRAND.name} - ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Independent third-party analytical testing for research peptides. RP-HPLC purity, LC-MS identity, ICP-MS elemental impurities, sterility and endotoxin testing with verifiable Certificates of Analysis.",
  keywords: [
    "third-party peptide testing",
    "research peptide analysis",
    "RP-HPLC purity testing",
    "LC-MS identity confirmation",
    "certificate of analysis verification",
    "independent analytical laboratory",
  ],
  authors: [{ name: BRAND.name }],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} - ${BRAND.tagline}`,
    description:
      "Independent third-party analytical testing for research peptides, with verifiable Certificates of Analysis.",
    url: appUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} - ${BRAND.tagline}`,
    description:
      "Independent third-party analytical testing for research peptides.",
  },
  /**
   * Site-wide default. Marketing pages opt back in individually; the
   * verification, portal and admin routes stay excluded. See next.config.ts,
   * which also sets X-Robots-Tag headers as a second layer.
   */
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#131313" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        <ThemeProvider>
          <TooltipProvider delayDuration={280}>
            {children}
            <Toaster
              position="bottom-right"
              closeButton
              toastOptions={{
                classNames: {
                  toast:
                    "rounded-2xl border border-border bg-card text-card-foreground shadow-lift",
                  description: "text-muted-foreground",
                },
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
