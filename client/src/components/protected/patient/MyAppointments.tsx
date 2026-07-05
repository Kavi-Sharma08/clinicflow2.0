import type { ElementType } from "react";
import { CalendarCheckIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCancelPatientAppointment, usePatientAppointments } from "../../../hooks/usePatientPortal";
import type { AppointmentStatus, PatientAppointment } from "../../../types/patientPortal.types";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  BOOKED: "bg-blue-50 text-blue-700 ring-blue-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-100",
};

const STATUS_ICON: Record<AppointmentStatus, ElementType> = {
  BOOKED: ClockIcon,
  COMPLETED: CheckCircleIcon,
  CANCELLED: XCircleIcon,
};

const AppointmentCard = ({ appointment, onCancel }: { appointment: PatientAppointment; onCancel: (appointment: PatientAppointment) => void }) => {
  const Icon = STATUS_ICON[appointment.status];
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CalendarCheckIcon size={24} weight="duotone" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-950">Dr. {appointment.doctor.fullName}</p>
            <p className="mt-1 text-sm text-slate-500">{appointment.doctor.specialization ?? appointment.doctor.specializations?.[0] ?? "General consultation"}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Queue #{appointment.queueNumber}</span>
              {appointment.consultationFee ? <span className="rounded-full bg-slate-100 px-3 py-1">₹{appointment.consultationFee}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[appointment.status]}`}>
            <Icon size={14} /> {appointment.status}
          </span>
          {appointment.status === "BOOKED" && (
            <button onClick={() => onCancel(appointment)} className="rounded-full border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50">Cancel</button>
          )}
        </div>
      </div>
      {appointment.notes && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{appointment.notes}</p>}
    </div>
  );
};

const MyAppointments = () => {
  const appointmentsQuery = usePatientAppointments();
  const cancelMutation = useCancelPatientAppointment();
  const [pendingCancel, setPendingCancel] = useState<PatientAppointment | null>(null);
  const [reason, setReason] = useState("");

  const confirmCancel = () => {
    if (!pendingCancel) return;
    if (!reason.trim()) {
      toast.error("Please add cancellation reason");
      return;
    }
    cancelMutation.mutate(
      { id: pendingCancel.id, cancellationReason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled");
          setPendingCancel(null);
          setReason("");
        },
        onError: () => toast.error("Unable to cancel appointment"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Patient queue</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My appointments</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Track active bookings, completed visits, cancellations, and live queue changes.</p>
      </section>

      {appointmentsQuery.isLoading && [1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[2rem] bg-slate-200" />)}
      {!appointmentsQuery.isLoading && appointmentsQuery.data?.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-base font-bold text-slate-950">No appointments yet</p>
          <p className="mt-2 text-sm text-slate-500">Book a verified doctor to start your queue journey.</p>
        </div>
      )}
      <div className="space-y-4">
        {appointmentsQuery.data?.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} onCancel={setPendingCancel} />)}
      </div>

      {pendingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-950">Cancel appointment?</h2>
            <p className="mt-2 text-sm text-slate-500">Dr. {pendingCancel.doctor.fullName} · Queue #{pendingCancel.queueNumber}</p>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Reason for cancelling" className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setPendingCancel(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Keep appointment</button>
              <button onClick={confirmCancel} disabled={cancelMutation.isPending} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50">{cancelMutation.isPending ? "Cancelling…" : "Cancel appointment"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
