"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

/**
 * Root error boundary.
 *
 * Shows the digest rather than the raw message: in production Next replaces the
 * message with a generic string anyway, and the digest is what correlates to the
 * server log entry without leaking internals to the visitor.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[boundary] unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo href="/" />

      <span className="mt-14 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </span>

      <h1 className="mt-7 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-4 max-w-md text-balance text-[15px] leading-relaxed text-muted-foreground">
        An unexpected error interrupted this page. Trying again often resolves it.
        If it persists, contact the laboratory and quote the reference below.
      </p>

      {error.digest ? (
        <p className="mt-5 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      ) : null}

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home aria-hidden />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
