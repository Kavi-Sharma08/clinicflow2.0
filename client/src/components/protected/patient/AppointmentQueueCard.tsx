import { useState, type FormEvent } from "react";
import {
  CalendarCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowClockwiseIcon,
  WarningCircleIcon,
  CalendarPlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import type { PatientAppointment } from "../../../types/patientPortal.types";
import { useAppointmentQueueStatus, useRequestReschedule } from "../../../hooks/usePatientPortal";
import Badge from "../../common/Badge";

interface AppointmentQueueCardProps {
  appointment: PatientAppointment;
  onCancel: (appointment: PatientAppointment) => void;
}

const formatTimeStr = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
};

const formatDateStr = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const AppointmentQueueCard: React.FC<AppointmentQueueCardProps> = ({ appointment, onCancel }) => {
  const isToday =
    new Date(appointment.appointmentDate).toDateString() === new Date().toDateString();

  const isLiveEligible =
    isToday &&
    (appointment.status === "BOOKED" ||
      appointment.status === "CHECKED_IN" ||
      appointment.status === "WAITING" ||
      appointment.status === "IN_CONSULTATION");

  const { data: liveStatus } = useAppointmentQueueStatus(isLiveEligible ? appointment.id : null);
  const currentStatus = liveStatus?.status ?? appointment.status;

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("Morning (09:00 - 12:00)");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const rescheduleMutation = useRequestReschedule();

  const handleSubmitReschedule = (e: FormEvent) => {
    e.preventDefault();
    const formattedReason = [
      rescheduleReason.trim(),
      preferredTimeSlot ? `Preferred window: ${preferredTimeSlot}` : "",
    ].filter(Boolean).join(" · ");

    rescheduleMutation.mutate(
      {
        appointmentId: appointment.id,
        payload: {
          requestedDate: preferredDate || undefined,
          reason: formattedReason || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Reschedule request submitted for admin review");
          setIsRescheduleModalOpen(false);
          setRescheduleReason("");
          setPreferredDate("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to submit reschedule request";
          toast.error(msg);
        },
      }
    );
  };

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className="cf-card p-5 transition hover:border-slate-300">
      {/* Header Info */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-100">
            <CalendarCheckIcon size={22} weight="duotone" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Dr. {appointment.doctor.fullName}</h3>
              <Badge variant={currentStatus.toLowerCase() as any} size="sm">
                {currentStatus.replace("_", " ")}
              </Badge>
              {isLiveEligible && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Queue
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {appointment.doctor.specialization ?? appointment.doctor.specializations?.[0] ?? "Consultation"}
              {appointment.doctor.department ? ` · ${appointment.doctor.department}` : ""}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                {formatDateStr(appointment.appointmentDate)}
              </span>
              <span className="rounded-md bg-sky-50 border border-sky-200 text-sky-800 px-2.5 py-0.5 font-bold">
                Queue #{appointment.queueNumber}
              </span>
              {appointment.consultationFee ? (
                <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                  ₹{appointment.consultationFee}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(currentStatus === "BOOKED" || currentStatus === "WAITING" || currentStatus === "CHECKED_IN") && (
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Cancel
            </button>
          )}
          {currentStatus === "NO_SHOW" && !appointment.rescheduleRequest && (
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 shadow-sm"
            >
              <ArrowClockwiseIcon size={14} weight="bold" />
              Request Reschedule
            </button>
          )}
        </div>
      </div>

      {/* NO SHOW STATUS BANNER & RESCHEDULE STATUS */}
      {currentStatus === "NO_SHOW" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <WarningCircleIcon size={24} className="text-amber-700 shrink-0 mt-0.5" weight="duotone" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Consultation Marked as Missed (No-Show)
              </p>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                You were not present when your queue number was called. Your queue spot has been released.
              </p>

              {/* Reschedule Request State */}
              {appointment.rescheduleRequest ? (
                <div className="mt-3 rounded-lg border border-amber-200/80 bg-white p-3 text-xs">
                  {appointment.rescheduleRequest.status === "PENDING" && (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                          Reschedule Request Pending Admin Review
                        </span>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Requested: {formatDateStr(appointment.rescheduleRequest.createdAt)}
                          {appointment.rescheduleRequest.requestedDate && ` · Requested Date: ${formatDateStr(appointment.rescheduleRequest.requestedDate)}`}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium italic">In Review</span>
                    </div>
                  )}

                  {appointment.rescheduleRequest.status === "APPROVED" && (
                    <div>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                        <CheckCircleIcon size={14} weight="bold" /> Reschedule Approved
                      </span>
                      <p className="mt-1 text-[11px] text-slate-700 font-medium">
                        Admin approved your reschedule. A new appointment has been scheduled for you.
                      </p>
                    </div>
                  )}

                  {appointment.rescheduleRequest.status === "REJECTED" && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800">
                          Reschedule Request Declined
                        </span>
                        {appointment.rescheduleRequest.rejectionReason && (
                          <p className="mt-1 text-[11px] text-slate-700">
                            Reason: {appointment.rescheduleRequest.rejectionReason}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRescheduleModalOpen(true)}
                        className="rounded bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 self-start sm:self-auto"
                      >
                        Request Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsRescheduleModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
                  >
                    <ArrowClockwiseIcon size={14} weight="bold" />
                    Request Appointment Reschedule
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULED NOTICE */}
      {currentStatus === "RESCHEDULED" && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
          <div className="flex items-center gap-3">
            <CalendarPlusIcon size={24} className="text-indigo-700 shrink-0" weight="duotone" />
            <div>
              <p className="text-xs font-bold text-indigo-950">
                This Appointment Was Rescheduled
              </p>
              <p className="mt-0.5 text-xs text-indigo-800">
                A replacement consultation has been booked on the clinic schedule. Please check your upcoming appointments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LIVE QUEUE STATUS CALLOUT FOR TODAY */}
      {isLiveEligible && (
        <div className="mt-4 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
          {currentStatus === "IN_CONSULTATION" ? (
            <div className="flex items-center gap-3 text-emerald-950 bg-emerald-100/70 p-3 rounded-lg border border-emerald-300">
              <CheckCircleIcon size={28} className="text-emerald-700 shrink-0" weight="fill" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  IT'S YOUR TURN!
                </p>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Dr. {appointment.doctor.fullName} is ready for you. Please proceed to the consultation room now.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Position in Queue
                </span>
                <span className="mt-0.5 text-xl font-bold text-sky-700">
                  {liveStatus?.positionInLine ? `#${liveStatus.positionInLine}` : "Calculating…"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Patients Ahead
                </span>
                <span className="mt-0.5 text-xl font-bold text-slate-800">
                  {liveStatus ? liveStatus.patientsAhead : "—"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Est. Consultation Time
                </span>
                <span className="mt-0.5 text-sm font-bold text-slate-900 flex items-center gap-1">
                  <ClockIcon size={15} className="text-sky-600" />
                  {formatTimeStr(liveStatus?.estimatedTime || appointment.estimatedTime || appointment.scheduledTime || appointment.appointmentTime)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {appointment.notes && (
        <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600 border border-slate-100">
          <span className="font-bold text-slate-800">Notes: </span> {appointment.notes}
        </p>
      )}

      {/* RESCHEDULE REQUEST MODAL */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <ArrowClockwiseIcon size={20} className="text-sky-600" weight="bold" />
                <span>Request Appointment Reschedule</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XIcon size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Submit your preferred date and time for Dr. {appointment.doctor.fullName}. Our clinic administrators will review your request and confirm a new slot.
            </p>

            <form onSubmit={handleSubmitReschedule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Date (Optional)
                </label>
                <input
                  type="date"
                  min={todayIso}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Time Window
                </label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                  <option value="Afternoon (13:00 - 17:00)">Afternoon (13:00 - 17:00)</option>
                  <option value="Evening (17:00 - 20:00)">Evening (17:00 - 20:00)</option>
                  <option value="Any Available Time">Any Available Time</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason or Notes for Clinic Admin
                </label>
                <textarea
                  rows={3}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Delayed due to medical emergency, requesting rescheduling to tomorrow."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={rescheduleMutation.isPending}
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 shadow-sm"
                >
                  {rescheduleMutation.isPending ? "Submitting…" : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentQueueCard;
