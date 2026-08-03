import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

/**
 * Wordmark.
 *
 * The mark is a stylised lava flow inside a rounded square - drawn inline as
 * SVG so it inherits colour, needs no network request, and stays crisp at any
 * size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-lava-gradient shadow-subtle",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-full" fill="none">
        {/* Flow lines suggesting a chromatographic trace. */}
        <path
          d="M4 24c3.4 0 4.6-5 7-5s3.2 3 5.4 3 3-6 6-6 3.2 2.4 5.6 2.4"
          stroke="white"
          strokeOpacity="0.92"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <circle cx="11" cy="19" r="1.9" fill="white" fillOpacity="0.95" />
        <circle cx="22" cy="16" r="1.5" fill="white" fillOpacity="0.7" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  showTagline = false,
  href = "/",
}: {
  className?: string;
  showTagline?: boolean;
  href?: string | null;
}) {
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-tightest">
          {BRAND.name}
        </span>
        {showTagline ? (
          <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-overline text-muted-foreground">
            Independent Laboratory
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      aria-label={`${BRAND.name} - home`}
    >
      {content}
    </Link>
  );
}
