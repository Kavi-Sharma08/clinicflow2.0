import type { ReactNode } from "react";
import type { AppointmentStatus, VerificationStatus } from "../../../../types/doctorPortal.types";
import Badge, { type BadgeVariant } from "../../../common/Badge";

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  NOT_SUBMITTED: "default",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  BOOKED: "booked",
  WAITING: "waiting",
  IN_CONSULTATION: "in_consultation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

export function StatusBadge({ status }: { status: VerificationStatus | AppointmentStatus | string }) {
  const variant = STATUS_VARIANT_MAP[status] || "default";
  const label = status.replace(/_/g, " ");

  return (
    <Badge variant={variant} dot={status === "IN_CONSULTATION" || status === "WAITING" || status === "VERIFIED"}>
      {label}
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="cf-card p-4 transition-all hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
          {icon}
        </div>
      </div>
      <p className="mt-2.5 text-xs text-slate-500 leading-normal">{description}</p>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="cf-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? "h-20"}`} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatTimeOnly(value: string) {
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(value));
}

