import React from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@phosphor-icons/react";
import type { DoctorAppointmentDTO } from "../../../../types/doctorPortal.types";
import { StatusBadge, formatTimeOnly } from "../shared/DoctorPortalAtoms";
import Badge from "../../../common/Badge";

interface AppointmentCardProps {
  appointment: DoctorAppointmentDTO;
  onUpdateStatus: (id: string, status: "COMPLETED" | "CANCELLED", reason?: string) => void;
  isUpdating: boolean;
}

const AppointmentCard = ({ appointment, onUpdateStatus, isUpdating }: AppointmentCardProps) => {
  const isBooked = appointment.status === "BOOKED";


  return (
    <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md lg:grid-cols-[200px_1fr_auto_auto] lg:items-center">
      
      {/* Time & Queue */}
      <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
        <div className="flex items-center gap-2 text-slate-800">
          <ClockIcon size={18} weight="duotone" className="text-blue-500" />
          <span className="text-lg font-bold tracking-tight">
            {formatTimeOnly(appointment.appointmentTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">Queue #{appointment.queueNumber}</Badge>
          <StatusBadge status={appointment.status} />
        </div>
      </div>

      {/* Patient Info */}
      <div className="flex flex-col">
        <p className="font-semibold text-slate-950">{appointment.patient.fullName}</p>
        <p className="text-sm text-slate-500">
          {appointment.patient.phone} <span className="mx-1 text-slate-300">•</span> {appointment.patient.email}
        </p>
        <div className="mt-1 flex gap-2">
          {appointment.patient.gender && (
            <span className="text-xs text-slate-400 capitalize">{appointment.patient.gender.toLowerCase()}</span>
          )}
          {appointment.patient.bloodGroup && (
            <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
              Blood: {appointment.patient.bloodGroup.replace("_", "")}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 lg:justify-end">
        <button
          disabled={!isBooked || isUpdating}
          onClick={() => onUpdateStatus(appointment.id, "COMPLETED")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
        >
          <CheckCircleIcon size={16} weight="bold" /> Complete
        </button>
        <button
          disabled={!isBooked || isUpdating}
          onClick={() => onUpdateStatus(appointment.id, "CANCELLED", "Cancelled by doctor")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
        >
          <XCircleIcon size={16} weight="bold" /> Cancel
        </button>
      </div>

    </div>
  );
};

export default AppointmentCard;
