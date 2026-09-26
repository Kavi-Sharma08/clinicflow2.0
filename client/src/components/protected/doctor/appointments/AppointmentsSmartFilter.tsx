import React, { useMemo, useCallback } from "react";
import { SmartFilter, type FilterFieldDef, type ActiveFilter } from "../../../common/SmartFilter";
import { doctorPortalService } from "../../../../services/doctorPortalService";

interface AppointmentsSmartFilterProps {
  selectedDate: string;
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
  dateNode?: React.ReactNode;
  extraActions?: React.ReactNode;
  className?: string;
}

const AppointmentsSmartFilter = ({
  selectedDate,
  filters,
  onChange,
  dateNode,
  extraActions,
  className = "",
}: AppointmentsSmartFilterProps) => {
  // Each autocomplete field gets a fetcher bound to the selected date
  const fetchPatientNames = useCallback(
    (query: string) => doctorPortalService.getAppointmentFilterOptions(selectedDate, "patientName", query),
    [selectedDate],
  );

  const fetchPhones = useCallback(
    (query: string) => doctorPortalService.getAppointmentFilterOptions(selectedDate, "phone", query),
    [selectedDate],
  );

  const fetchEmails = useCallback(
    (query: string) => doctorPortalService.getAppointmentFilterOptions(selectedDate, "email", query),
    [selectedDate],
  );

  const fields: FilterFieldDef[] = useMemo(() => [
    {
      id: "patientName",
      label: "Patient Name",
      type: "autocomplete",
      fetchOptions: fetchPatientNames,
      placeholder: "Search patient name...",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Booked", value: "BOOKED" },
        { label: "Waiting", value: "WAITING" },
        { label: "In Consultation", value: "IN_CONSULTATION" },
        { label: "Completed", value: "COMPLETED" },
        { label: "No Show", value: "NO_SHOW" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    {
      id: "phone",
      label: "Phone",
      type: "autocomplete",
      fetchOptions: fetchPhones,
      placeholder: "Search phone...",
    },
    {
      id: "email",
      label: "Email",
      type: "autocomplete",
      fetchOptions: fetchEmails,
      placeholder: "Search email...",
    },
    {
      id: "queueNumber",
      label: "Queue Number",
      type: "number",
      placeholder: "Queue #",
    },
  ], [fetchPatientNames, fetchPhones, fetchEmails]);

  return (
    <SmartFilter
      fields={fields}
      filters={filters}
      onChange={onChange}
      dateNode={dateNode}
      extraActions={extraActions}
      className={className}
    />
  );
};

export default AppointmentsSmartFilter;
