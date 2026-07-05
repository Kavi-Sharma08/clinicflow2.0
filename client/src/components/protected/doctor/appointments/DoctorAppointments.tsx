import { useMemo, useState } from "react";
import { CheckCircleIcon, MagnifyingGlassIcon, XCircleIcon } from "@phosphor-icons/react";
import { useDoctorAppointments, useUpdateDoctorAppointmentStatus } from "../../../../hooks/useDoctorPortal";
import type { AppointmentStatus } from "../../../../types/doctorPortal.types";
import { EmptyState, SectionCard, SkeletonBlock, StatusBadge, formatDateTime } from "../shared/DoctorPortalAtoms";

const STATUS_OPTIONS: Array<AppointmentStatus | "ALL"> = ["ALL", "BOOKED", "COMPLETED", "CANCELLED"];

const DoctorAppointments = () => {
  const [status, setStatus] = useState<AppointmentStatus | "ALL">("BOOKED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ status, search, page, limit: 10 }), [status, search, page]);
  const { data, isLoading } = useDoctorAppointments(filters);
  const updateStatus = useUpdateDoctorAppointmentStatus();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Appointment Queue</h1>
          <p className="mt-1 text-sm text-slate-500">Manage booked patients, consultation status, and daily queue movement.</p>
        </div>
      </div>

      <SectionCard title="Queue Controls" description="Search and filter patients from backend-driven appointment data.">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search patient name, phone, email..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item}
                onClick={() => { setStatus(item); setPage(1); }}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${status === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Patient appointments" description="Actions are status-aware. Completed or cancelled appointments cannot be changed again.">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-20" />)}</div>
        ) : data?.data.length ? (
          <div className="space-y-3">
            {data.data.map((appointment) => (
              <div key={appointment.id} className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:bg-slate-50 lg:grid-cols-[1fr_180px_180px_220px] lg:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">#{appointment.queueNumber}</div>
                  <div>
                    <p className="font-semibold text-slate-950">{appointment.patient.fullName}</p>
                    <p className="text-sm text-slate-500">{appointment.patient.phone} · {appointment.patient.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Schedule</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{formatDateTime(appointment.appointmentTime)}</p>
                </div>
                <StatusBadge status={appointment.status} />
                <div className="flex gap-2 lg:justify-end">
                  <button
                    disabled={appointment.status !== "BOOKED" || updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: appointment.id, status: "COMPLETED" })}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200"
                  >
                    <CheckCircleIcon size={16} /> Complete
                  </button>
                  <button
                    disabled={appointment.status !== "BOOKED" || updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: appointment.id, status: "CANCELLED", cancellationReason: "Cancelled by doctor" })}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200"
                  >
                    <XCircleIcon size={16} /> Cancel
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 text-sm text-slate-500">
              <span>Page {data.meta.page} of {Math.max(data.meta.totalPages, 1)} · {data.meta.total} appointments</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold disabled:opacity-50">Previous</button>
                <button disabled={page >= data.meta.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="No appointments found" description="Try changing status filters or search terms. New patient bookings will appear here automatically." />
        )}
      </SectionCard>
    </div>
  );
};

export default DoctorAppointments;
