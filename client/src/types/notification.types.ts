export type NotificationType =
  | "DOCTOR_PROFILE_SUBMITTED"
  | "DOCTOR_PROFILE_VERIFIED"
  | "DOCTOR_PROFILE_REJECTED"
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_COMPLETED"
  | "QUEUE_UPDATED"
  | "PROFILE_UPDATED";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH";

export interface ClinicNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: ClinicNotification[];
  unreadCount: number;
}
