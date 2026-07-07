import { CalendarCheckIcon } from "@phosphor-icons/react";
import type { DoctorAvailabilityDTO } from "../../../../types/doctor.types";
import { dayLabel } from "./doctorProfileFormatters";
import { SectionCard } from "./InfoField";

export function DoctorAvailabilityPanel({ availability }: { availability: DoctorAvailabilityDTO[] }) {
  return (
    <SectionCard title="Weekly Availability" description="Availability slots configured by the doctor.">
      {availability.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No availability has been configured yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {availability.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarCheckIcon size={20} weight="duotone" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">{dayLabel(slot.dayOfWeek)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{slot.startTime} - {slot.endTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-950">{slot.maxAppointments}</p>
                <p className="text-xs text-slate-500">max appointments</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${slot.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {slot.isAvailable ? "Available" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
