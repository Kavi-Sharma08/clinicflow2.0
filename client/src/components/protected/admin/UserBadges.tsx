import type { DoctorVerificationStatus } from "../../../types/role.types";

export function RoleBadge({ role }: { role: "DOCTOR" | "PATIENT" }) {
  const styles = role === "DOCTOR" ? "bg-sky-50 text-sky-600" : "bg-violet-50 text-violet-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{role === "DOCTOR" ? "Doctor" : "Patient"}</span>;
}

const VERIFICATION_STYLES: Record<DoctorVerificationStatus, string> = {
  VERIFIED: "text-emerald-600",
  PENDING: "text-amber-600",
  REJECTED: "text-rose-600",
  NOT_SUBMITTED: "text-slate-400",
};
const VERIFICATION_DOT: Record<DoctorVerificationStatus, string> = {
  VERIFIED: "bg-emerald-500",
  PENDING: "bg-amber-500",
  REJECTED: "bg-rose-500",
  NOT_SUBMITTED: "bg-slate-300",
};

export function DoctorVerificationStatus({ status }: { status: DoctorVerificationStatus }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${VERIFICATION_STYLES[status] ?? "text-slate-400"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${VERIFICATION_DOT[status] ?? "bg-slate-300"}`} />
      {status.replace("_", " ")}
    </span>
  );
}

export function EmailVerifiedStatus({ isVerified }: { isVerified: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${isVerified ? "text-emerald-600" : "text-slate-400"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isVerified ? "bg-emerald-500" : "bg-slate-300"}`} />
      {isVerified ? "Verified" : "Unverified"}
    </span>
  );
}
