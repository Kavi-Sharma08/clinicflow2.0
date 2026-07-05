import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { doctorPortalService } from "../../../../services/doctorPortalService";
import { DOCTOR_PORTAL_KEYS, useDoctorAvailability } from "../../../../hooks/useDoctorPortal";
import type { DayOfWeek } from "../../../../types/doctorPortal.types";
import { EmptyState, SectionCard, SkeletonBlock } from "../shared/DoctorPortalAtoms";

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DoctorAvailability = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useDoctorAvailability();
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("MONDAY");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("14:00");
  const [maxAppointments, setMaxAppointments] = useState(10);

  const createMutation = useMutation({
    mutationFn: () => doctorPortalService.createAvailability({ dayOfWeek, startTime, endTime, maxAppointments, isAvailable: true }),
    onSuccess: () => {
      toast.success("Availability slot created.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorPortalService.deleteAvailability(id),
    onSuccess: () => {
      toast.success("Availability slot removed.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Availability Management</h1>
        <p className="mt-1 text-sm text-slate-500">Define weekly working windows. Patient bookings are constrained by this backend availability.</p>
      </div>

      <SectionCard title="Create availability slot" description="Set a day, consultation window, and maximum queue capacity.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
          <label className="text-sm font-semibold text-slate-700">
            Day
            <select value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value as DayOfWeek)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Start time
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            End time
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Max appointments
            <input type="number" min={1} value={maxAppointments} onChange={(event) => setMaxAppointments(Number(event.target.value))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
          </label>
          <button disabled={createMutation.isPending} onClick={() => createMutation.mutate()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300">
            <PlusIcon size={16} /> Add Slot
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Weekly availability" description="Slots are used by patient booking and doctor dashboard capacity metrics.">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-20" />)}</div>
        ) : data?.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-950">{slot.dayOfWeek}</p>
                  <p className="mt-1 text-sm text-slate-500">{slot.startTime} – {slot.endTime} · {slot.maxAppointments} patients</p>
                </div>
                <button onClick={() => deleteMutation.mutate(slot.id)} disabled={deleteMutation.isPending} className="rounded-2xl border border-rose-100 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50">
                  <TrashIcon size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No availability configured" description="Create your first weekly slot so patients can start booking appointments." />
        )}
      </SectionCard>
    </div>
  );
};

export default DoctorAvailability;
