import React from "react";
import {
  CalendarCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { PatientAppointment } from "../../../types/patientPortal.types";
import { useAppointmentQueueStatus } from "../../../hooks/usePatientPortal";
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

const AppointmentQueueCard: React.FC<AppointmentQueueCardProps> = ({ appointment, onCancel }) => {
  const isToday =
    new Date(appointment.appointmentDate).toDateString() === new Date().toDateString();

  const isLiveEligible =
    isToday && (appointment.status === "BOOKED" || appointment.status === "WAITING" || appointment.status === "IN_CONSULTATION");

  const { data: liveStatus } = useAppointmentQueueStatus(isLiveEligible ? appointment.id : null);
  const currentStatus = liveStatus?.status ?? appointment.status;

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
                {new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
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
          {(currentStatus === "BOOKED" || currentStatus === "WAITING") && (
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default AppointmentQueueCard;

