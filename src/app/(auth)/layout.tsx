import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import {
  AuroraBackground,
  MoleculeBackground,
} from "@/components/shared/molecule-background";
import { BRAND } from "@/lib/constants";

/**
 * Split-screen auth shell.
 *
 * The right-hand panel is decorative and hidden below `lg`, so the form is never
 * pushed below the fold on a phone.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── Form side ── */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to site
          </Link>
        </div>

        <main
          id="main"
          className="flex flex-1 items-center justify-center py-12"
        >
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>

      {/* ── Decorative side ── */}
      <div className="relative hidden overflow-hidden bg-charcoal-900 lg:block">
        <AuroraBackground />
        <MoleculeBackground className="opacity-45" />
        <div className="bg-blueprint absolute inset-0 opacity-[0.14]" />

        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <ShieldCheck className="size-10 text-lava-400" aria-hidden />
          <blockquote className="mt-8 max-w-md text-balance text-2xl font-semibold leading-snug tracking-tight">
            &ldquo;A certificate is only worth the independence of the laboratory
            that signed it.&rdquo;
          </blockquote>
          <p className="mt-6 max-w-md text-pretty text-[15px] leading-relaxed text-white/55">
            {BRAND.name} holds no ownership stake in, and takes no commission
            from, any manufacturer or distributor of research peptides. We report
            what we measured.
          </p>
        </div>
      </div>
    </div>
  );
}
