"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  AlertTriangle,
  FileCheck2,
  FileUp,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/misc";
import { createCertificate } from "@/app/actions/admin-certificates";
import { TEST_CATALOG } from "@/lib/pricing";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_PDF_BYTES } from "@/lib/storage/limits";

export interface CustomerOption {
  id: string;
  companyName: string;
  email: string;
}

export interface OrderOption {
  id: string;
  orderNumber: string;
  customerId: string;
  samples: {
    id: string;
    productName: string;
    batchNumber: string;
    sampleCode: string;
  }[];
}

/**
 * Certificate upload form.
 *
 * Uses a `FormData` submission because it carries a file. The action recomputes
 * the certificate number, verification token and hash server-side - nothing
 * security-relevant is accepted from this form.
 */
export function CertificateUploadForm({
  customers,
  orders,
  defaultOrderId,
}: {
  customers: CustomerOption[];
  orders: OrderOption[];
  defaultOrderId?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const preselected = orders.find((o) => o.id === defaultOrderId);

  const [customerId, setCustomerId] = React.useState(
    preselected?.customerId ?? "",
  );
  const [orderId, setOrderId] = React.useState(defaultOrderId ?? "");
  const [sampleId, setSampleId] = React.useState("");
  const [result, setResult] = React.useState<"PASS" | "FAIL" | "INCONCLUSIVE">(
    "PASS",
  );
  const [testedFor, setTestedFor] = React.useState<string[]>([]);
  const [releaseImmediately, setReleaseImmediately] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  // Only orders belonging to the chosen client, so a certificate cannot be
  // accidentally attached across accounts.
  const availableOrders = customerId
    ? orders.filter((o) => o.customerId === customerId)
    : orders;

  const selectedOrder = orders.find((o) => o.id === orderId);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      maxSize: MAX_PDF_BYTES,
      onDrop: (accepted) => {
        if (accepted[0]) setFile(accepted[0]);
      },
    });

  /** Copies product and batch from the selected sample. */
  function applySample(id: string) {
    setSampleId(id);
    const sample = selectedOrder?.samples.find((s) => s.id === id);
    if (!sample) return;

    const form = document.getElementById(
      "certificate-form",
    ) as HTMLFormElement | null;
    if (!form) return;

    const product = form.elements.namedItem("product") as HTMLInputElement | null;
    const batch = form.elements.namedItem(
      "batchNumber",
    ) as HTMLInputElement | null;
    if (product) product.value = sample.productName;
    if (batch) batch.value = sample.batchNumber;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (!file) {
      toast.error("Attach the certificate PDF before saving.");
      return;
    }
    if (!customerId) {
      toast.error("Select the client this certificate belongs to.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("pdf", file);
    formData.set("customerId", customerId);
    formData.set("orderId", orderId);
    formData.set("sampleId", sampleId);
    formData.set("result", result);
    formData.set("releaseImmediately", String(releaseImmediately));
    formData.delete("testedFor");
    for (const test of testedFor) formData.append("testedFor", test);

    setPending(true);
    try {
      const response = await createCertificate(formData);

      if (!response.ok) {
        if (response.fieldErrors) setErrors(response.fieldErrors);
        toast.error(response.message ?? "Could not create the certificate.");
        return;
      }

      toast.success(response.message ?? "Certificate created.");
      router.push(`/admin/certificates/${response.certificateId}`);
    } finally {
      setPending(false);
    }
  }

  function FieldError({ name }: { name: string }) {
    const message = errors[name]?.[0];
    if (!message) return null;
    return (
      <p className="mt-1.5 text-[13px] text-destructive" role="alert">
        {message}
      </p>
    );
  }

  return (
    <form id="certificate-form" onSubmit={onSubmit} className="space-y-6">
      {/* ── PDF dropzone ── */}
      <Card className="p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <FileUp className="size-4 text-lava-500" aria-hidden />
          <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
            Certificate Document
          </h2>
        </div>
        <Separator className="my-5" />

        {!file ? (
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
              isDragActive
                ? "border-lava-500 bg-lava-50/70 dark:bg-lava-950/30"
                : "border-border bg-muted/25 hover:border-lava-300 hover:bg-muted/45 dark:hover:border-lava-900",
            )}
          >
            <input {...getInputProps()} aria-label="Certificate PDF" />
            <span className="flex size-12 items-center justify-center rounded-2xl bg-background shadow-subtle">
              <Upload className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <p className="mt-5 text-[15px] font-semibold">
              {isDragActive
                ? "Drop the PDF here"
                : "Drag the completed COA here, or click to browse"}
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              PDF only, up to {MAX_PDF_BYTES / 1024 / 1024} MB
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/35 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--pass)/0.12)] text-[hsl(var(--pass))]">
              <FileCheck2 className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setFile(null)}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {fileRejections.length > 0 ? (
          <p className="mt-3 text-[13px] text-destructive" role="alert">
            {fileRejections[0].errors[0]?.message ??
              "That file could not be accepted."}
          </p>
        ) : null}
      </Card>

      {/* ── Association ── */}
      <Card className="p-6 sm:p-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
          Client & Order
        </h2>
        <Separator className="my-5" />

        <div className="space-y-5">
          <div>
            <Label htmlFor="customer" required>
              Client
            </Label>
            <Select
              value={customerId || undefined}
              onValueChange={(value) => {
                setCustomerId(value);
                // Clear order/sample - they belong to the previous client.
                setOrderId("");
                setSampleId("");
              }}
            >
              <SelectTrigger id="customer" className="mt-2">
                <SelectValue placeholder="Select the client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.companyName} - {customer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-[13px] text-muted-foreground">
              The client&apos;s company name is copied onto the certificate exactly
              as recorded.
            </p>
            <FieldError name="customerId" />
          </div>

          <div>
            <Label htmlFor="order">
              Order{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Select
              value={orderId || undefined}
              onValueChange={(value) => {
                setOrderId(value);
                setSampleId("");
              }}
              disabled={!customerId}
            >
              <SelectTrigger id="order" className="mt-2">
                <SelectValue
                  placeholder={
                    customerId ? "Link to an order" : "Select a client first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.orderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrder && selectedOrder.samples.length > 0 ? (
            <div>
              <Label htmlFor="sample">
                Sample{" "}
                <span className="font-normal text-muted-foreground">
                  (optional - pre-fills product and batch)
                </span>
              </Label>
              <Select value={sampleId || undefined} onValueChange={applySample}>
                <SelectTrigger id="sample" className="mt-2">
                  <SelectValue placeholder="Link to a sample" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOrder.samples.map((sample) => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.productName} - {sample.batchNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </Card>

      {/* ── Certificate detail ── */}
      <Card className="p-6 sm:p-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
          Certificate Detail
        </h2>
        <Separator className="my-5" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="product" required>
              Product name
            </Label>
            <Input id="product" name="product" className="mt-2" />
            <FieldError name="product" />
          </div>

          <div>
            <Label htmlFor="batchNumber" required>
              Batch number
            </Label>
            <Input
              id="batchNumber"
              name="batchNumber"
              className="mt-2 font-mono text-sm"
            />
            <FieldError name="batchNumber" />
          </div>

          <div>
            <Label htmlFor="lotNumber">Lot number</Label>
            <Input
              id="lotNumber"
              name="lotNumber"
              className="mt-2 font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="issuedDate" required>
              Issue date
            </Label>
            <Input
              id="issuedDate"
              name="issuedDate"
              type="date"
              className="mt-2"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
            <FieldError name="issuedDate" />
          </div>

          <div>
            <Label htmlFor="result" required>
              Overall result
            </Label>
            <Select
              value={result}
              onValueChange={(value) =>
                setResult(value as "PASS" | "FAIL" | "INCONCLUSIVE")
              }
            >
              <SelectTrigger id="result" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PASS">Pass</SelectItem>
                <SelectItem value="FAIL">Fail</SelectItem>
                <SelectItem value="INCONCLUSIVE">Inconclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="purityResult">Purity result (%)</Label>
            <Input
              id="purityResult"
              name="purityResult"
              className="mt-2 tabular"
              placeholder="99.12"
              inputMode="decimal"
            />
            <FieldError name="purityResult" />
          </div>

          <div>
            <Label htmlFor="contentResult">Net peptide content (mg)</Label>
            <Input
              id="contentResult"
              name="contentResult"
              className="mt-2 tabular"
              placeholder="9.84"
              inputMode="decimal"
            />
            <FieldError name="contentResult" />
          </div>
        </div>

        <div className="mt-6">
          <Label>Analyses performed</Label>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Listed on the public verification page.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TEST_CATALOG.map((test) => {
              const selected = testedFor.includes(test.label);
              return (
                <button
                  key={test.key}
                  type="button"
                  onClick={() =>
                    setTestedFor((prev) =>
                      selected
                        ? prev.filter((t) => t !== test.label)
                        : [...prev, test.label],
                    )
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    selected
                      ? "border-lava-500 bg-lava-500 text-white"
                      : "border-border text-muted-foreground hover:border-lava-300 hover:text-foreground",
                  )}
                  aria-pressed={selected}
                >
                  {test.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="summary">Laboratory summary</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            className="mt-2"
            placeholder="Shown on the verification page beneath the results."
          />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="signedBy">Approved by</Label>
            <Input
              id="signedBy"
              name="signedBy"
              className="mt-2"
              placeholder="Dr. A. Analyst"
            />
          </div>
          <div>
            <Label htmlFor="signedTitle">Title</Label>
            <Input
              id="signedTitle"
              name="signedTitle"
              className="mt-2"
              placeholder="Reviewing Analyst"
            />
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="internalNotes">Internal notes</Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            rows={2}
            className="mt-2"
            placeholder="Never shown to the client or on the verification page."
          />
        </div>
      </Card>

      {/* ── Release ── */}
      <Card
        className={cn(
          "p-6 sm:p-7",
          releaseImmediately &&
            "border-lava-400 bg-lava-50/50 dark:border-lava-800 dark:bg-lava-950/25",
        )}
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-overline text-muted-foreground">
          Release
        </h2>
        <Separator className="my-5" />

        <label className="flex cursor-pointer items-start gap-3.5">
          <Checkbox
            checked={releaseImmediately}
            onCheckedChange={(checked) =>
              setReleaseImmediately(checked === true)
            }
            className="mt-0.5"
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                Release immediately on save
              </span>
              <Badge variant={releaseImmediately ? "primary" : "muted"}>
                {releaseImmediately ? "Will be verifiable" : "Stays private"}
              </Badge>
            </span>
            <span className="mt-1.5 block text-[13px] leading-relaxed text-muted-foreground">
              Releasing makes this certificate reachable by anyone holding its
              number or QR code, and emails the client a link. Leave unchecked to
              save it privately and release it after review.
            </span>
          </span>
        </label>

        {releaseImmediately ? (
          <div className="mt-5 flex gap-3 rounded-2xl border border-lava-300 bg-white p-4 dark:border-lava-900 dark:bg-charcoal-900">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-lava-600 dark:text-lava-400"
              aria-hidden
            />
            <p className="text-[13px] leading-relaxed">
              Check the PDF, the client, the batch number and the result before
              saving. Once a certificate has been released it cannot be deleted - only revoked, which is visible to anyone who checks it.
            </p>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={pending}>
          {!pending ? <ShieldCheck aria-hidden /> : null}
          {releaseImmediately ? "Create and release" : "Create as private"}
        </Button>
      </div>
    </form>
  );
}
