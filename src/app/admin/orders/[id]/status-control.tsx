"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  createInvoiceForOrder,
  updateOrderNotes,
  updateOrderStatus,
} from "@/app/actions/admin-orders";
import { ORDER_STATUS_META } from "@/components/shared/status";
import type { OrderStatus } from "@prisma/client";

const SELECTABLE: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "SAMPLE_RECEIVED",
  "TESTING",
  "AWAITING_RESULTS",
  "COMPLETED",
  "SHIPPED",
  "CANCELLED",
];

/** Statuses whose transition sends the customer an email. */
const EMAILS_CUSTOMER = new Set<OrderStatus>([
  "ACCEPTED",
  "REJECTED",
  "SAMPLE_RECEIVED",
  "TESTING",
  "AWAITING_RESULTS",
  "SHIPPED",
]);

export function StatusControl({
  orderId,
  currentStatus,
  adminNotes,
  hasInvoice,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  adminNotes: string | null;
  hasInvoice: boolean;
}) {
  const router = useRouter();

  const [status, setStatus] = React.useState<OrderStatus>(currentStatus);
  const [note, setNote] = React.useState("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [carrier, setCarrier] = React.useState("");
  const [tracking, setTracking] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const [notes, setNotes] = React.useState(adminNotes ?? "");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [invoicing, setInvoicing] = React.useState(false);

  const changed = status !== currentStatus;
  const willEmail = changed && EMAILS_CUSTOMER.has(status);

  async function submitStatus() {
    setPending(true);
    try {
      const result = await updateOrderStatus({
        orderId,
        status,
        note,
        rejectionReason,
        trackingCarrier: carrier,
        trackingNumber: tracking,
      });

      if (!result.ok) {
        toast.error(result.message ?? "Could not update the order.");
        return;
      }

      toast.success(result.message ?? "Status updated.");
      setNote("");
      setRejectionReason("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const result = await updateOrderNotes(orderId, notes);
      if (!result.ok) {
        toast.error(result.message ?? "Could not save notes.");
        return;
      }
      toast.success("Notes saved.");
      router.refresh();
    } finally {
      setSavingNotes(false);
    }
  }

  async function generateInvoice() {
    setInvoicing(true);
    try {
      const result = await createInvoiceForOrder(orderId);
      if (!result.ok) {
        toast.error(result.message ?? "Could not create an invoice.");
        return;
      }
      toast.success(result.message ?? "Invoice created.");
      router.refresh();
    } finally {
      setInvoicing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Status transition ── */}
      <div>
        <Label htmlFor="status">Order status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as OrderStatus)}
        >
          <SelectTrigger id="status" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SELECTABLE.map((option) => (
              <SelectItem key={option} value={option}>
                {ORDER_STATUS_META[option].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {ORDER_STATUS_META[status].description}
        </p>
      </div>

      {status === "REJECTED" ? (
        <div>
          <Label htmlFor="rejectionReason" required>
            Reason for rejection
          </Label>
          <Textarea
            id="rejectionReason"
            rows={3}
            className="mt-2"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Shown to the customer on their order and included in the email."
          />
          <p className="mt-2 text-[13px] text-muted-foreground">
            This text is sent to the customer verbatim. Be specific and factual.
          </p>
        </div>
      ) : null}

      {status === "SHIPPED" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              className="mt-2"
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              placeholder="e.g. FedEx"
            />
          </div>
          <div>
            <Label htmlFor="tracking">Tracking number</Label>
            <Input
              id="tracking"
              className="mt-2 font-mono text-sm"
              value={tracking}
              onChange={(event) => setTracking(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="note">
          Note for the timeline{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="note"
          rows={2}
          className="mt-2"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Appears on the customer's progress timeline."
        />
      </div>

      {willEmail ? (
        <div className="flex gap-3 rounded-2xl border border-lava-200 bg-lava-50/55 p-4 dark:border-lava-900/70 dark:bg-lava-950/25">
          <Mail
            className="mt-0.5 size-4 shrink-0 text-lava-600 dark:text-lava-400"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed">
            Saving this change will{" "}
            <strong className="font-semibold">email the customer</strong>{" "}
            automatically.
          </p>
        </div>
      ) : null}

      <Button
        onClick={submitStatus}
        disabled={
          !changed ||
          (status === "REJECTED" && rejectionReason.trim().length === 0)
        }
        loading={pending}
        className="w-full"
      >
        {!pending ? <Send aria-hidden /> : null}
        {changed ? "Update status" : "No change to save"}
      </Button>

      <Separator />

      {/* ── Invoice ── */}
      <div>
        <p className="text-sm font-semibold">Invoicing</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {hasInvoice
            ? "An invoice has already been raised for this order."
            : "Generates an invoice from this order's line items and emails it to the client."}
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={generateInvoice}
          disabled={hasInvoice}
          loading={invoicing}
        >
          {hasInvoice ? "Invoice already raised" : "Generate invoice"}
        </Button>
      </div>

      <Separator />

      {/* ── Internal notes ── */}
      <div>
        <Label htmlFor="adminNotes">Internal notes</Label>
        <Textarea
          id="adminNotes"
          rows={4}
          className="mt-2"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Visible to laboratory staff only. Never shown to the client."
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={saveNotes}
          loading={savingNotes}
          disabled={notes === (adminNotes ?? "")}
        >
          {!savingNotes ? <Save aria-hidden /> : null}
          Save notes
        </Button>
      </div>
    </div>
  );
}
