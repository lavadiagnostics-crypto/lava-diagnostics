"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseScannedValue } from "@/lib/qr";

/**
 * QR scanner.
 *
 * Uses the native `BarcodeDetector` API where available, which needs no
 * dependency and no WASM download. Browsers without it (notably Safari and
 * Firefox at time of writing) get a clear explanation and the manual-entry
 * fallback rather than a broken viewfinder.
 *
 * The camera stream is torn down on every exit path - closing the dialog,
 * unmounting, a successful scan, or an error. A camera left running is both a
 * privacy problem and a battery one.
 */

type ScannerState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "scanning" }
  | { phase: "unsupported" }
  | { phase: "error"; message: string };

// Minimal shape of the BarcodeDetector API; it has no bundled TypeScript types.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as Record<string, unknown>)["BarcodeDetector"];
  return typeof ctor === "function" ? (ctor as BarcodeDetectorConstructor) : null;
}

export function QrScannerButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<ScannerState>({ phase: "idle" });

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number>(0);
  // Guards against a late detection firing after teardown has begun.
  const activeRef = React.useRef(false);

  const stop = React.useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Belt and braces: also stop if the component unmounts while scanning.
  React.useEffect(() => stop, [stop]);

  const start = React.useCallback(async () => {
    const Detector = getBarcodeDetector();
    if (!Detector) {
      setState({ phase: "unsupported" });
      return;
    }

    setState({ phase: "starting" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      activeRef.current = true;

      const video = videoRef.current;
      if (!video) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play();

      setState({ phase: "scanning" });

      const detector = new Detector({ formats: ["qr_code"] });

      const tick = async () => {
        if (!activeRef.current || !videoRef.current) return;

        try {
          const results = await detector.detect(videoRef.current);
          const raw = results[0]?.rawValue;

          if (raw) {
            const token = parseScannedValue(raw);
            if (token) {
              stop();
              setOpen(false);
              // Navigate to the token URL, which runs the ordinary verification.
              router.push(`/verify/${token}`);
              return;
            }
            // A QR that is not one of ours - keep scanning rather than failing,
            // since the user may simply have framed the wrong label.
          }
        } catch {
          // Per-frame detection failures are transient; keep going.
        }

        rafRef.current = requestAnimationFrame(() => void tick());
      };

      rafRef.current = requestAnimationFrame(() => void tick());
    } catch (error) {
      stop();
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera access was denied. Enable camera permission for this site, or enter the certificate number manually."
          : "Could not start the camera. Enter the certificate number manually instead.";
      setState({ phase: "error", message });
    }
  }, [router, stop]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      void start();
    } else {
      stop();
      setState({ phase: "idle" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => handleOpenChange(true)}
      >
        <Camera aria-hidden />
        Scan QR Code
      </Button>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan the certificate QR code</DialogTitle>
          <DialogDescription>
            Hold the QR code printed on the certificate steady inside the frame.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square overflow-hidden rounded-2xl bg-charcoal-950">
          <video
            ref={videoRef}
            className="size-full object-cover"
            playsInline
            muted
            aria-label="Camera viewfinder"
          />

          {/* Reticle */}
          {state.phase === "scanning" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative size-[62%]">
                {(
                  [
                    "left-0 top-0 border-l-2 border-t-2 rounded-tl-lg",
                    "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg",
                    "left-0 bottom-0 border-b-2 border-l-2 rounded-bl-lg",
                    "right-0 bottom-0 border-b-2 border-r-2 rounded-br-lg",
                  ] as const
                ).map((position) => (
                  <span
                    key={position}
                    className={`absolute size-9 border-lava-500 ${position}`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {state.phase === "starting" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-charcoal-950 text-white/70">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <p className="text-sm">Starting camera…</p>
            </div>
          ) : null}

          {state.phase === "unsupported" || state.phase === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-charcoal-950 px-8 text-center text-white/75">
              <AlertCircle className="size-6 text-lava-400" aria-hidden />
              <p className="text-sm leading-relaxed">
                {state.phase === "unsupported"
                  ? "This browser does not support in-page QR scanning. Use your phone's camera app to open the QR code, or enter the certificate number manually."
                  : state.message}
              </p>
            </div>
          ) : null}
        </div>

        <Button
          variant="outline"
          onClick={() => handleOpenChange(false)}
          className="w-full"
        >
          <X aria-hidden />
          Cancel and enter manually
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Scanning happens entirely on your device. No image is uploaded.
        </p>
      </DialogContent>
    </Dialog>
  );
}
