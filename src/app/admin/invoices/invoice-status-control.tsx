"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInvoiceStatus } from "@/app/actions/admin-orders";
import type { InvoiceStatus } from "@prisma/client";

const OPTIONS: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"];

/** Inline status selector on the invoices table. */
export function InvoiceStatusControl({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onChange(next: string) {
    if (next === status) return;

    setPending(true);
    try {
      const result = await updateInvoiceStatus(
        invoiceId,
        next as InvoiceStatus,
      );
      if (!result.ok) {
        toast.error(result.message ?? "Could not update the invoice.");
        return;
      }
      toast.success(result.message ?? "Invoice updated.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-9 w-[130px] text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option.charAt(0) + option.slice(1).toLowerCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
