import type { ComponentType, ReactNode } from "react";
import { CheckIcon, CurrencyInrIcon, FileTextIcon, StethoscopeIcon, XIcon } from "@phosphor-icons/react";
import type { AdminDoctorDetailDTO } from "../../../../types/doctor.types";
import { formatCurrency, formatDate } from "./doctorProfileFormatters";
import { StatusBadge } from "./StatusBadge";

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cf-card p-5">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ size?: number; weight?: "regular" | "bold" | "duotone" | "fill" }> }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        <Icon size={18} weight="duotone" />
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

export function DoctorSidebarPanels({ detail }: { detail: AdminDoctorDetailDTO }) {
  const profile = detail.doctorProfile;

  return (
    <div className="space-y-5">
      <SideCard title="Verification Status">
        <div className="flex items-center justify-between gap-4">
          <div>
            <StatusBadge status={detail.verificationStatus} />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Status is returned by the backend and mapped directly from schema2 verificationStatus.
            </p>
          </div>
        </div>
      </SideCard>

      {profile && (
        <>
          <SideCard title="Operational Summary">
            <div className="grid grid-cols-1 gap-3">
              <MiniStat label="Consultation Fee" value={formatCurrency(profile.consultationFee)} icon={CurrencyInrIcon} />
              <MiniStat label="Documents" value={`${profile.documents.length} uploaded`} icon={FileTextIcon} />
              <MiniStat label="Availability Slots" value={`${profile.availability.length} configured`} icon={StethoscopeIcon} />
            </div>
          </SideCard>

          <SideCard title="Appointment Summary">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xl font-bold text-blue-700">{profile.appointmentSummary.upcoming}</p>
                <p className="text-xs text-blue-700/70">Upcoming</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xl font-bold text-emerald-700">{profile.appointmentSummary.completed}</p>
                <p className="text-xs text-emerald-700/70">Completed</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-xl font-bold text-rose-700">{profile.appointmentSummary.cancelled}</p>
                <p className="text-xs text-rose-700/70">Cancelled</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xl font-bold text-slate-900">{profile.appointmentSummary.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </SideCard>

          <SideCard title="Review Checklist">
            <div className="space-y-3 text-sm">
              {[
                { label: "Registration number provided", done: Boolean(profile.registrationNumber) },
                { label: "Documents uploaded", done: profile.documents.length > 0 },
                { label: "Professional details complete", done: Boolean(profile.department && profile.medicalCouncilName) },
                { label: "Joined on", done: Boolean(profile.joiningDate), value: formatDate(profile.joiningDate) },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {item.done ? <CheckIcon size={13} weight="bold" /> : <XIcon size={13} weight="bold" />}
                  </span>
                  <span className="text-slate-600">{item.value ? `${item.label}: ${item.value}` : item.label}</span>
                </div>
              ))}
            </div>
          </SideCard>
        </>
      )}
    </div>
  );
}
