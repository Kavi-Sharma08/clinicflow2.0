import AdminPlaceholder from "./AdminPlaceholder";
import { CalendarCheckIcon } from "@phosphor-icons/react";

const AdminAppointmentsPlaceholder = () => (
  <AdminPlaceholder
    title="Appointment Management"
    description="Manage the complete lifecycle of all clinic appointments, override statuses, and resolve conflicts."
    icon={<CalendarCheckIcon size={32} weight="duotone" />}
  />
);

export default AdminAppointmentsPlaceholder;
