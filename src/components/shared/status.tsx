import {
  AlertTriangle,
  Ban,
  Beaker,
  CheckCircle2,
  Clock,
  FileCheck2,
  FlaskConical,
  Hourglass,
  Inbox,
  PackageCheck,
  ShieldCheck,
  ShieldOff,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CertificateResult,
  CertificateStatus,
  InvoiceStatus,
  OrderStatus,
} from "@prisma/client";

/** Single place where every enum's presentation is defined. */

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    variant: "default" | "primary" | "outline" | "muted" | "pass" | "fail" | "pending";
    icon: typeof Clock;
    /** Position in the customer-facing progress timeline, or null if off-track. */
    step: number | null;
  }
> = {
  PENDING: {
    label: "Pending review",
    description: "Submitted and awaiting laboratory acceptance.",
    variant: "pending",
    icon: Clock,
    step: 1,
  },
  ACCEPTED: {
    label: "Accepted",
    description: "Accepted by the laboratory. Awaiting your samples.",
    variant: "primary",
    icon: FileCheck2,
    step: 2,
  },
  REJECTED: {
    label: "Not accepted",
    description: "The laboratory was unable to proceed with this submission.",
    variant: "fail",
    icon: XCircle,
    step: null,
  },
  SAMPLE_RECEIVED: {
    label: "Samples received",
    description: "Samples arrived and passed receiving inspection.",
    variant: "primary",
    icon: Inbox,
    step: 3,
  },
  TESTING: {
    label: "Testing",
    description: "Analysis in progress on qualified instrumentation.",
    variant: "primary",
    icon: FlaskConical,
    step: 4,
  },
  AWAITING_RESULTS: {
    label: "Awaiting results",
    description: "Data under review by the second analyst.",
    variant: "pending",
    icon: Hourglass,
    step: 5,
  },
  COMPLETED: {
    label: "Completed",
    description: "Analysis complete and certificate issued.",
    variant: "pass",
    icon: CheckCircle2,
    step: 6,
  },
  SHIPPED: {
    label: "Shipped",
    description: "Retained material dispatched to your address.",
    variant: "pass",
    icon: Truck,
    step: 7,
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order was cancelled.",
    variant: "muted",
    icon: Ban,
    step: null,
  },
};

/** The happy path, in order, used to render the tracking timeline. */
export const ORDER_TIMELINE: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "SAMPLE_RECEIVED",
  "TESTING",
  "AWAITING_RESULTS",
  "COMPLETED",
  "SHIPPED",
];

export function OrderStatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const meta = ORDER_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      {showIcon ? <Icon aria-hidden /> : null}
      {meta.label}
    </Badge>
  );
}

export const CERTIFICATE_STATUS_META: Record<
  CertificateStatus,
  {
    label: string;
    description: string;
    variant: "default" | "primary" | "outline" | "muted" | "pass" | "fail" | "pending";
    icon: typeof ShieldCheck;
  }
> = {
  PRIVATE: {
    label: "Private",
    description:
      "Not released. Verification reports this certificate as not found.",
    variant: "muted",
    icon: Clock,
  },
  VERIFIED: {
    label: "Released",
    description:
      "Reachable by anyone holding the certificate number or QR code.",
    variant: "pass",
    icon: ShieldCheck,
  },
  REVOKED: {
    label: "Revoked",
    description: "Withdrawn. Verification reports it as revoked.",
    variant: "fail",
    icon: ShieldOff,
  },
  ARCHIVED: {
    label: "Archived",
    description:
      "Superseded by a newer revision and retained for the audit trail.",
    variant: "outline",
    icon: PackageCheck,
  },
};

export function CertificateStatusBadge({
  status,
  className,
}: {
  status: CertificateStatus;
  className?: string;
}) {
  const meta = CERTIFICATE_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon aria-hidden />
      {meta.label}
    </Badge>
  );
}

export const RESULT_META: Record<
  CertificateResult,
  { label: string; variant: "pass" | "fail" | "pending"; icon: typeof CheckCircle2 }
> = {
  PASS: { label: "Pass", variant: "pass", icon: CheckCircle2 },
  FAIL: { label: "Fail", variant: "fail", icon: XCircle },
  INCONCLUSIVE: {
    label: "Inconclusive",
    variant: "pending",
    icon: AlertTriangle,
  },
};

export function ResultBadge({
  result,
  className,
  size,
}: {
  result: CertificateResult;
  className?: string;
  size?: "default" | "lg";
}) {
  const meta = RESULT_META[result];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} size={size} className={className}>
      <Icon aria-hidden />
      {meta.label}
    </Badge>
  );
}

export const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "primary" | "outline" | "muted" | "pass" | "fail" | "pending" }
> = {
  DRAFT: { label: "Draft", variant: "muted" },
  SENT: { label: "Sent", variant: "primary" },
  PAID: { label: "Paid", variant: "pass" },
  OVERDUE: { label: "Overdue", variant: "fail" },
  VOID: { label: "Void", variant: "outline" },
};

export function InvoiceStatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  const meta = INVOICE_STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

/** Large PASS/FAIL stamp shown at the top of a verified certificate. */
export function ResultStamp({
  result,
  className,
}: {
  result: CertificateResult;
  className?: string;
}) {
  const meta = RESULT_META[result];
  const Icon = meta.icon;
  const tone =
    result === "PASS"
      ? "border-[hsl(var(--pass)/0.28)] bg-[hsl(var(--pass)/0.09)] text-[hsl(var(--pass))]"
      : result === "FAIL"
        ? "border-[hsl(var(--fail)/0.28)] bg-[hsl(var(--fail)/0.09)] text-[hsl(var(--fail))]"
        : "border-[hsl(var(--pending)/0.28)] bg-[hsl(var(--pending)/0.09)] text-[hsl(var(--pending))]";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border-2 px-5 py-3",
        tone,
        className,
      )}
    >
      <Icon className="size-7 shrink-0" aria-hidden />
      <div className="text-left">
        <div className="text-2xl font-bold uppercase leading-none tracking-tight">
          {meta.label}
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-overline opacity-80">
          Specification
        </div>
      </div>
    </div>
  );
}

export { Beaker };
