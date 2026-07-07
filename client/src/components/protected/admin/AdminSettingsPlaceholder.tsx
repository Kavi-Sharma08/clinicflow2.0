import AdminPlaceholder from "./AdminPlaceholder";
import { GearSixIcon } from "@phosphor-icons/react";

const AdminSettingsPlaceholder = () => (
  <AdminPlaceholder
    title="System Settings"
    description="Configure clinic rules, manage administrator access, and adjust operational parameters."
    icon={<GearSixIcon size={32} weight="duotone" />}
  />
);

export default AdminSettingsPlaceholder;
