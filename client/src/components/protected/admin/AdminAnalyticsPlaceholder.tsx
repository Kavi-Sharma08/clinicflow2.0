import AdminPlaceholder from "./AdminPlaceholder";
import { ChartLineUpIcon } from "@phosphor-icons/react";

const AdminAnalyticsPlaceholder = () => (
  <AdminPlaceholder
    title="Operational Analytics"
    description="Track daily appointments, doctor performance, and clinic revenue with real-time operational metrics."
    icon={<ChartLineUpIcon size={32} weight="duotone" />}
  />
);

export default AdminAnalyticsPlaceholder;
