import api from "../lib/axios";
import type { ClinicNotification, NotificationsResponse } from "../types/notification.types";

interface ApiNotificationResponse {
  success: boolean;
  data: ClinicNotification[];
  meta: { unreadCount: number };
}

export const notificationService = {
  async list(): Promise<NotificationsResponse> {
    const response = await api.get<ApiNotificationResponse>("/notifications");
    return {
      data: response.data.data,
      unreadCount: response.data.meta.unreadCount,
    };
  },

  async markRead(id: string): Promise<ClinicNotification> {
    const response = await api.patch<{ success: boolean; data: ClinicNotification }>(`/notifications/${id}/read`);
    return response.data.data;
  },

  async markAllRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },
};
