import { useState, useMemo } from "react";
import { useDoctorAppointments, useUpdateDoctorAppointmentStatus } from "../../../../hooks/useDoctorPortal";
import type { DoctorAppointmentFilters } from "../../../../types/doctorPortal.types";
import type { ActiveFilter } from "../../../common/SmartFilter";
import { SectionCard } from "../shared/DoctorPortalAtoms";
import DatePicker from "../../../common/DatePicker";
import AppointmentsSmartFilter from "./AppointmentsSmartFilter";
import AppointmentsList from "./AppointmentsList";

const DoctorAppointments = () => {
  // 1. Date-first: default to today (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA")
  );

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

  // 4. Fetch data
  const { data, isLoading } = useDoctorAppointments(apiFilters);
  const updateStatus = useUpdateDoctorAppointmentStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Appointment Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your daily patient queue and consultation status.
          </p>
        </div>
      </div>

      {/* Date & Inline Filters */}
      <SectionCard title="Consultation Date & Filters">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setActiveFilters([]);
              setPage(1);
            }}
            className="w-full lg:w-48 lg:shrink-0"
          />

          <div className="h-px w-full bg-slate-100 lg:h-auto lg:min-h-[2.5rem] lg:w-px lg:self-stretch" />

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
        </div>
      </SectionCard>

      {/* Appointments List */}
      <SectionCard title="Patient Queue">
        <AppointmentsList
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          onUpdateStatus={(id, status, reason) =>
            updateStatus.mutate({ id, status, cancellationReason: reason })
          }
          isUpdating={updateStatus.isPending}
        />
      </SectionCard>
    </div>
  );
};

export default DoctorAppointments;
