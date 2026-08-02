import Link from "next/link";
import { ArrowLeft, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { MoleculeBackground } from "@/components/shared/molecule-background";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center">
      <MoleculeBackground className="opacity-30" />

      <div className="relative">
        <Logo href="/" />

        <p className="tabular mt-14 text-7xl font-semibold tracking-tightest text-lava-500 sm:text-8xl">
          404
        </p>
        <h1 className="mt-6 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          This page does not exist
        </h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-[15px] leading-relaxed text-muted-foreground">
          The address may be mistyped, or the page may have moved. If you were
          looking for a certificate, use the verification page rather than a
          direct link.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <ArrowLeft aria-hidden />
              Back to home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/verify">
              <ScanLine aria-hidden />
              Verify a Certificate
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
