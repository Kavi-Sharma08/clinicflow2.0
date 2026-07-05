import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import type { AdminDoctorProfileDTO } from "../../../../types/doctor.types";
import { formatDate } from "./doctorProfileFormatters";
import { SectionCard } from "./InfoField";

export function DoctorActivityPanel({ doctorProfile }: { doctorProfile: AdminDoctorProfileDTO }) {
  const rows = [
    { label: "Profile created", value: formatDate(doctorProfile.createdAt) },
    { label: "Last updated", value: formatDate(doctorProfile.updatedAt) },
    { label: "Practice started", value: formatDate(doctorProfile.practiceStartDate) },
    { label: "Joined ClinicFlow", value: formatDate(doctorProfile.joiningDate) },
  ];

  return (
    <SectionCard title="Activity Timeline" description="Important timestamps from the doctor profile lifecycle.">
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <ClockCounterClockwiseIcon size={18} weight="duotone" />
              </span>
              {index < rows.length - 1 && <span className="h-8 w-px bg-gray-100" />}
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold text-gray-950">{row.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
