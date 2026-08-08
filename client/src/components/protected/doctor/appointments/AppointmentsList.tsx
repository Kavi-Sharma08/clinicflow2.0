import React from "react";
import type { PaginatedDoctorAppointmentsDTO } from "../../../../types/doctorPortal.types";
import { EmptyState, SkeletonBlock } from "../shared/DoctorPortalAtoms";
import AppointmentCard from "./AppointmentCard";

interface AppointmentsListProps {
  data: PaginatedDoctorAppointmentsDTO | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onUpdateStatus: (id: string, status: "COMPLETED" | "CANCELLED", reason?: string) => void;
  isUpdating: boolean;
}

const AppointmentsList = ({ data, isLoading, page, onPageChange, onUpdateStatus, isUpdating }: AppointmentsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <EmptyState
        title="No appointments found"
        description="Try selecting a different date or clearing your filters."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {data.data.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-500">
        <span>
          Page <span className="font-semibold text-slate-700">{data.meta.page}</span> of{" "}
          <span className="font-semibold text-slate-700">{Math.max(data.meta.totalPages, 1)}</span>
          <span className="mx-2">•</span>
          <span className="font-semibold text-slate-700">{data.meta.total}</span> appointments
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Previous
          </button>
          <button
            disabled={page >= data.meta.totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsList;
