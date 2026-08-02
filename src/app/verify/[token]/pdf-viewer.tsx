"use client";

import * as React from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Certificate PDF viewer.
 *
 * Renders the browser's built-in PDF viewer in an iframe pointed at our
 * authorised stream route. This is a deliberate choice over a JS PDF library:
 *
 *   • No worker bundle, no CDN dependency, no version drift between the viewer
 *     and the document.
 *   • The bytes never enter JavaScript, so there is nothing for a script to read
 *     out, cache in memory, or accidentally exfiltrate.
 *   • Native viewers already handle text selection, search, zoom, printing and
 *     accessibility better than a canvas re-implementation.
 *
 * The trade-off is that a small number of browsers (older mobile Safari, some
 * in-app webviews) will not render an inline PDF, so the fallback below always
 * offers opening in a new tab and downloading.
 */
export function PdfViewer({
  certificateId,
  certificateNumber,
  verificationToken,
}: {
  certificateId: string;
  certificateNumber: string;
  /**
   * Passed through as `?t=` so the stream route can authorise a QR-scan visitor
   * who has no grant cookie. Same credential as the page URL they are already
   * on, so this adds no disclosure.
   */
  verificationToken: string;
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const base = `/api/certificates/${certificateId}/pdf`;
  const src = `${base}?t=${encodeURIComponent(verificationToken)}`;
  const downloadHref = `${src}&download=1`;

  // If the frame has not reported load within a few seconds, surface the
  // fallback rather than leaving a permanent spinner.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [loaded]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        {!loaded && !failed ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted">
            <Loader2
              className="size-6 animate-spin text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">Loading certificate…</p>
          </div>
        ) : null}

        <iframe
          src={src}
          title={`Certificate of Analysis ${certificateNumber}`}
          className="h-[68vh] min-h-[420px] w-full bg-white"
          onLoad={() => setLoaded(true)}
          // Nothing in a PDF needs script or same-origin access to our app.
          sandbox="allow-same-origin"
        />
      </div>

      {failed && !loaded ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/45 p-5">
          <div className="flex gap-3.5">
            <FileText
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium">
                Your browser could not display the certificate inline
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                This is a browser limitation, not a problem with the certificate.
                Open it in a new tab or download it instead.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <a href={downloadHref} download={`${certificateNumber}.pdf`}>
            <Download aria-hidden />
            Download PDF
          </a>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <a href={src} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            Open in new tab
          </a>
        </Button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        This document is served from private storage through an authorised,
        time-limited session. The link above is not shareable — anyone else
        opening it must verify the certificate themselves.
      </p>
    </div>
  );
}
