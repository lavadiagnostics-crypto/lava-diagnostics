"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Archive,
  EyeOff,
  FileUp,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import {
  archiveCertificate,
  deleteCertificate,
  makeCertificatePrivate,
  releaseCertificate,
  replaceCertificatePdf,
  revokeCertificate,
} from "@/app/actions/admin-certificates";
import { CERTIFICATE_STATUS_META } from "@/components/shared/status";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_PDF_BYTES } from "@/lib/storage/limits";
import type { CertificateStatus } from "@prisma/client";

/**
 * Certificate lifecycle actions.
 *
 * Destructive and disclosure-changing actions require an explicit confirmation
 * dialog. Releasing in particular is irreversible in effect — once a certificate
 * has been verifiable, third parties may have recorded its contents — so the
 * copy says so rather than presenting it as a toggle.
 */
export function LifecycleControls({
  certificateId,
  certificateNumber,
  status,
  revision,
  pdfSizeBytes,
}: {
  certificateId: string;
  certificateNumber: string;
  status: CertificateStatus;
  revision: number;
  pdfSizeBytes: number | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const [revokeOpen, setRevokeOpen] = React.useState(false);
  const [revokeReason, setRevokeReason] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [replaceOpen, setReplaceOpen] = React.useState(false);
  const [replacementFile, setReplacementFile] = React.useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_PDF_BYTES,
    onDrop: (accepted) => {
      if (accepted[0]) setReplacementFile(accepted[0]);
    },
  });

  /** Runs an action with a shared pending/toast/refresh cycle. */
  async function run(
    key: string,
    fn: () => Promise<{ ok: boolean; message?: string }>,
    onSuccess?: () => void,
  ) {
    setPending(key);
    try {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message ?? "That action could not be completed.");
        return;
      }
      toast.success(result.message ?? "Done.");
      onSuccess?.();
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const meta = CERTIFICATE_STATUS_META[status];

  return (
    <div className="space-y-5">
      {/* ── Current state ── */}
      <div className="rounded-2xl border border-border bg-muted/35 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold">Current status</span>
          <Badge
            variant={
              status === "VERIFIED"
                ? "pass"
                : status === "REVOKED"
                  ? "fail"
                  : status === "PRIVATE"
                    ? "pending"
                    : "outline"
            }
          >
            {meta.label}
          </Badge>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {meta.description}
        </p>
      </div>

      {/* ── Release / unrelease ── */}
      {status === "PRIVATE" ? (
        <div>
          <Button
            className="w-full"
            loading={pending === "release"}
            onClick={() =>
              run("release", () => releaseCertificate(certificateId))
            }
          >
            {pending !== "release" ? <ShieldCheck aria-hidden /> : null}
            Release certificate
          </Button>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            Makes this certificate verifiable by anyone holding its number or QR
            code, and emails the client a link.
          </p>
        </div>
      ) : null}

      {status === "VERIFIED" ? (
        <div>
          <Button
            variant="outline"
            className="w-full"
            loading={pending === "private"}
            onClick={() =>
              run("private", () => makeCertificatePrivate(certificateId))
            }
          >
            {pending !== "private" ? <EyeOff aria-hidden /> : null}
            Make private again
          </Button>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            Verification will report this certificate as not found. Use this to
            correct a premature release — use <strong>Revoke</strong> if the
            document itself is wrong and copies are in circulation.
          </p>
        </div>
      ) : null}

      <Separator />

      {/* ── Replace PDF ── */}
      <div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setReplaceOpen(true)}
        >
          <FileUp aria-hidden />
          Replace PDF
        </Button>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          Currently revision {revision}
          {pdfSizeBytes ? ` · ${formatBytes(pdfSizeBytes)}` : ""}. Replacing bumps
          the revision and recomputes the integrity hash. The QR code and
          verification token are preserved, so printed documentation keeps working.
        </p>
      </div>

      <Separator />

      {/* ── Revoke ── */}
      {status !== "REVOKED" ? (
        <div>
          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setRevokeOpen(true)}
          >
            <ShieldOff aria-hidden />
            Revoke certificate
          </Button>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            The certificate keeps resolving but reports itself as withdrawn, with
            your reason shown. This is the correct action when copies of an
            incorrect document may be in circulation.
          </p>
        </div>
      ) : null}

      {/* ── Archive ── */}
      {status !== "ARCHIVED" ? (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            loading={pending === "archive"}
            onClick={() =>
              run("archive", () => archiveCertificate(certificateId))
            }
          >
            {pending !== "archive" ? <Archive aria-hidden /> : null}
            Archive
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Retains the record for audit but stops it verifying.
          </p>
        </div>
      ) : null}

      {/* ── Delete ── */}
      {status !== "VERIFIED" ? (
        <div className="border-t border-border pt-5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden />
            Delete permanently
          </Button>
        </div>
      ) : null}

      {/* ── Revoke dialog ── */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke {certificateNumber}?</DialogTitle>
            <DialogDescription>
              Anyone verifying this certificate will be told it has been withdrawn,
              and will see the reason you give below. The client is notified.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="revokeReason" required>
              Reason for revocation
            </Label>
            <Textarea
              id="revokeReason"
              rows={3}
              className="mt-2"
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              placeholder="e.g. Transcription error in the reported purity value; superseded by revision 2."
            />
            <p className="mt-2 text-[13px] text-muted-foreground">
              Shown publicly on the verification page. At least 10 characters.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={pending === "revoke"}
              disabled={revokeReason.trim().length < 10}
              onClick={() =>
                run(
                  "revoke",
                  () =>
                    revokeCertificate({
                      certificateId,
                      reason: revokeReason.trim(),
                    }),
                  () => {
                    setRevokeOpen(false);
                    setRevokeReason("");
                  },
                )
              }
            >
              Revoke certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Replace dialog ── */}
      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace the PDF</DialogTitle>
            <DialogDescription>
              The new document becomes revision {revision + 1}. Its integrity hash
              changes, so anyone comparing hashes can tell the certificate was
              reissued.
            </DialogDescription>
          </DialogHeader>

          {!replacementFile ? (
            <div
              {...getRootProps()}
              className={cn(
                "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                isDragActive
                  ? "border-lava-500 bg-lava-50/70 dark:bg-lava-950/30"
                  : "border-border bg-muted/25 hover:border-lava-300",
              )}
            >
              <input {...getInputProps()} aria-label="Replacement PDF" />
              <FileUp className="size-6 text-muted-foreground" aria-hidden />
              <p className="mt-4 text-sm font-semibold">
                Drop the replacement PDF here
              </p>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                PDF only, up to {MAX_PDF_BYTES / 1024 / 1024} MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/35 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {replacementFile.name}
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {formatBytes(replacementFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplacementFile(null)}
              >
                Change
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplaceOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={pending === "replace"}
              disabled={!replacementFile}
              onClick={() => {
                if (!replacementFile) return;
                const formData = new FormData();
                formData.set("certificateId", certificateId);
                formData.set("pdf", replacementFile);
                void run(
                  "replace",
                  () => replaceCertificatePdf(formData),
                  () => {
                    setReplaceOpen(false);
                    setReplacementFile(null);
                  },
                );
              }}
            >
              Replace PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {certificateNumber} permanently?</DialogTitle>
            <DialogDescription>
              This removes the record and its stored files entirely and cannot be
              undone. Only do this for a genuine mistake — an upload against the
              wrong client, or a test record.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-destructive/35 bg-destructive/[0.05] p-4">
            <p className="text-[13px] leading-relaxed">
              If this certificate was ever released, revoke it instead. Deleting it
              would leave anyone holding a copy unable to tell that it is void.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={pending === "delete"}
              onClick={() =>
                run(
                  "delete",
                  () => deleteCertificate(certificateId),
                  () => {
                    setDeleteOpen(false);
                    router.push("/admin/certificates");
                  },
                )
              }
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
