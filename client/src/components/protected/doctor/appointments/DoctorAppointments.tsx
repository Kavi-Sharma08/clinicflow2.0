import { useState, useMemo, useEffect } from "react";
import {
  useDoctorAppointments,
  useDoctorLiveQueue,
  useDoctorProfile,
  useUpdateDoctorAppointmentStatus,
  useStartConsultation,
  useCompleteConsultation,
  useMarkNoShow,
} from "../../../../hooks/useDoctorPortal";
import type { DoctorAppointmentFilters } from "../../../../types/doctorPortal.types";
import type { ActiveFilter } from "../../../common/SmartFilter";
import { SectionCard } from "../shared/DoctorPortalAtoms";
import DatePicker from "../../../common/DatePicker";
import AppointmentsSmartFilter from "./AppointmentsSmartFilter";
import AppointmentsList from "./AppointmentsList";
import LiveQueue from "./LiveQueue";
import { useRealtime } from "../../../../context/RealtimeContext";

const DoctorAppointments = () => {
  const { joinQueueRoom, leaveQueueRoom } = useRealtime();
  const { data: doctorProfile } = useDoctorProfile();
  const doctorProfileId = doctorProfile?.id;

  // 1. Date-first: default to today (YYYY-MM-DD)
  const todayDateStr = new Date().toLocaleDateString("en-CA");
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [viewMode, setViewMode] = useState<"LIVE" | "TABLE">("LIVE");

  // Join Socket room for live updates (room key = queue:doctor:<profileId>:<date>)
  useEffect(() => {
    if (doctorProfileId && selectedDate) {
      joinQueueRoom(doctorProfileId, selectedDate);
      return () => {
        leaveQueueRoom(doctorProfileId, selectedDate);
      };
    }
  }, [doctorProfileId, selectedDate, joinQueueRoom, leaveQueueRoom]);

  // 2. Inline filters state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [page, setPage] = useState(1);

  // 3. Build API payload — serialize only filters that have a value
  const apiFilters = useMemo<DoctorAppointmentFilters>(() => {
    const populated = activeFilters
      .filter((f) => f.value.trim() !== "")
      .map(({ fieldId, operator, value }) => ({ field: fieldId, operator, value }));

    return {
      date: selectedDate,
      filters: populated.length > 0 ? JSON.stringify(populated) : undefined,
      page,
      limit: 10,
    };
  }, [selectedDate, activeFilters, page]);

  // Data queries & mutations
  const { data: tableData, isLoading: isTableLoading } = useDoctorAppointments(apiFilters);
  const { data: queueSnapshot, isLoading: isQueueLoading } = useDoctorLiveQueue(selectedDate);

  const startConsultation = useStartConsultation();
  const completeConsultation = useCompleteConsultation();
  const markNoShow = useMarkNoShow();
  const updateStatus = useUpdateDoctorAppointmentStatus();

  const isPending =
    startConsultation.isPending ||
    completeConsultation.isPending ||
    markNoShow.isPending ||
    updateStatus.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Live Queue & Schedule</h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Realtime consultation queue, patient status updates, and schedule management.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode("LIVE")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "LIVE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Live Queue
          </button>
          <button
            type="button"
            onClick={() => setViewMode("TABLE")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "TABLE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Table & Filters
          </button>
        </div>
      </div>

      {/* Date Picker Header */}
      <SectionCard title="Consultation Date">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setActiveFilters([]);
              setPage(1);
            }}
            className="w-full lg:w-48"
          />

          {viewMode === "TABLE" && (
            <div className="min-w-0 flex-1">
              <AppointmentsSmartFilter
                selectedDate={selectedDate}
                filters={activeFilters}
                onChange={(newFilters) => {
                  setActiveFilters(newFilters);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Main View Container */}
      {viewMode === "LIVE" ? (
        <LiveQueue
          snapshot={queueSnapshot}
          isLoading={isQueueLoading}
          onStart={(id) => startConsultation.mutate(id)}
          onComplete={(id) => completeConsultation.mutate(id)}
          onNoShow={(id) => markNoShow.mutate(id)}
          onCancel={(id, reason) => updateStatus.mutate({ id, status: "CANCELLED", cancellationReason: reason })}
          isPending={isPending}
        />
      ) : (
        <SectionCard title="Filterable Patient List">
          <AppointmentsList
            data={tableData}
            isLoading={isTableLoading}
            page={page}
            onPageChange={setPage}
            onUpdateStatus={(id, status, reason) =>
              updateStatus.mutate({ id, status, cancellationReason: reason })
            }
            isUpdating={isPending}
          />
        </SectionCard>
      )}
    </div>
  );
};

export default DoctorAppointments;

