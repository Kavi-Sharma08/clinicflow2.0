import React, { useMemo, useCallback } from "react";
import { SmartFilter, type FilterFieldDef, type ActiveFilter } from "../../../common/SmartFilter";
import { doctorPortalService } from "../../../../services/doctorPortalService";

interface AppointmentsSmartFilterProps {
  selectedDate: string;
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

const AppointmentsSmartFilter = ({ selectedDate, filters, onChange }: AppointmentsSmartFilterProps) => {
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
    },
    {
      id: "phone",
      label: "Phone",
      type: "autocomplete",
      fetchOptions: fetchPhones,
    },
    {
      id: "email",
      label: "Email",
      type: "autocomplete",
      fetchOptions: fetchEmails,
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: ["BOOKED", "COMPLETED", "CANCELLED"],
    },
    {
      id: "queueNumber",
      label: "Queue Number",
      type: "number",
    },
  ], [fetchPatientNames, fetchPhones, fetchEmails]);

  return (
    <SmartFilter
      fields={fields}
      filters={filters}
      onChange={onChange}
    />
  );
};

export default AppointmentsSmartFilter;
