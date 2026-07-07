import type { DoctorVerificationStatus } from "../../../../types/role.types";
import { statusLabel } from "./doctorProfileFormatters";

const STATUS_STYLES: Record<DoctorVerificationStatus, string> = {
  NOT_SUBMITTED: "border-slate-200 bg-slate-50 text-slate-600",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status }: { status: DoctorVerificationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
