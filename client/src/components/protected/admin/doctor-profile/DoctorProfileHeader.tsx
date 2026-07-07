import type { ComponentType } from "react";
import {
  BriefcaseIcon,
  CalendarBlankIcon,
  CurrencyInrIcon,
  EnvelopeSimpleIcon,
  IdentificationCardIcon,
  PhoneIcon,
  SealCheckIcon,
  StethoscopeIcon,
} from "@phosphor-icons/react";
import type { AdminDoctorDetailDTO } from "../../../../types/doctor.types";
import { formatCurrency, formatDate } from "./doctorProfileFormatters";
import { StatusBadge } from "./StatusBadge";

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? "D";
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase();
};

function HeaderMetric({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number; weight?: "regular" | "bold" | "duotone" | "fill" }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        <Icon size={18} weight="duotone" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function DoctorProfileHeader({ detail }: { detail: AdminDoctorDetailDTO }) {
  const { user, doctorProfile } = detail;
  const primarySpecialization = doctorProfile?.specializations[0] ?? "Doctor";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.fullName} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white ring-4 ring-white">
                {initials(user.fullName)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">{user.fullName}</h1>
                {user.emailVerified && <SealCheckIcon size={20} weight="fill" className="text-blue-500" />}
                <StatusBadge status={detail.verificationStatus} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <StethoscopeIcon size={16} /> {primarySpecialization}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <EnvelopeSimpleIcon size={16} /> {user.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PhoneIcon size={16} /> {user.phone}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(doctorProfile?.specializations ?? []).map((specialization) => (
                  <span key={specialization} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {specialization}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid min-w-[300px] grid-cols-1 gap-3 sm:grid-cols-2">
            <HeaderMetric icon={IdentificationCardIcon} label="Registration" value={doctorProfile?.registrationNumber ?? "Not submitted"} />
            <HeaderMetric icon={BriefcaseIcon} label="Department" value={doctorProfile?.department ?? "Not submitted"} />
            <HeaderMetric icon={CurrencyInrIcon} label="Consultation" value={doctorProfile ? formatCurrency(doctorProfile.consultationFee) : "Not submitted"} />
            <HeaderMetric icon={CalendarBlankIcon} label="Practice Since" value={doctorProfile ? formatDate(doctorProfile.practiceStartDate) : "Not submitted"} />
          </div>
        </div>
      </div>
    </section>
  );
}
