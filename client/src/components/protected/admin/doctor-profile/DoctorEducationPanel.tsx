import { GraduationCapIcon, MedalIcon } from "@phosphor-icons/react";
import type { AdminDoctorProfileDTO } from "../../../../types/doctor.types";
import { SectionCard } from "./InfoField";

function PillList({ values, emptyLabel }: { values: string[]; emptyLabel: string }) {
  if (values.length === 0) {
    return <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {value}
        </span>
      ))}
    </div>
  );
}

export function DoctorEducationPanel({ doctorProfile }: { doctorProfile: AdminDoctorProfileDTO }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Degrees" description="Formal medical degrees declared by the doctor.">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <GraduationCapIcon size={20} weight="duotone" />
        </div>
        <PillList values={doctorProfile.degrees} emptyLabel="No degrees submitted." />
      </SectionCard>

      <SectionCard title="Certifications" description="Additional certifications and professional training records.">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <MedalIcon size={20} weight="duotone" />
        </div>
        <PillList values={doctorProfile.certifications} emptyLabel="No certifications submitted." />
      </SectionCard>
    </div>
  );
}
