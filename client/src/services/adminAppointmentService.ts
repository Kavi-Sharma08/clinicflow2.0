import api from '../lib/axios';
import type {
  AdminAppointment,
  AdminAppointmentFilters,
  AdminAppointmentStats,
  AppointmentStatus,
  DoctorAvailableSlotsResponse,
  RescheduleRequestDTO,
} from '../types/adminAppointment.types';

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminAppointmentService = {
  async getAppointments(filters: AdminAppointmentFilters = {}): Promise<PaginatedResponse<AdminAppointment>> {
    const response = await api.get<PaginatedResponse<AdminAppointment>>('/admin/appointments', {
      params: filters,
    });
    return response.data;
  },

  async getAppointmentStats(): Promise<AdminAppointmentStats> {
    const response = await api.get<{ success: boolean; data: AdminAppointmentStats }>(
      '/admin/appointments/stats'
    );
    return response.data.data;
  },

  async getAppointmentDetail(id: string): Promise<AdminAppointment> {
    const response = await api.get<{ success: boolean; data: AdminAppointment }>(
      `/admin/appointments/${id}`
    );
    return response.data.data;
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    notes?: string,
    cancellationReason?: string
  ): Promise<AdminAppointment> {
    const response = await api.patch<{ success: boolean; message: string; data: AdminAppointment }>(
      `/admin/appointments/${id}/status`,
      { status, notes, cancellationReason }
    );
    return response.data.data;
  },

  async getRescheduleRequests(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<RescheduleRequestDTO>> {
    const response = await api.get<PaginatedResponse<RescheduleRequestDTO>>(
      '/admin/reschedule-requests',
      { params }
    );
    return response.data;
  },

  async getDoctorAvailableSlots(
    doctorId: string,
    date: string
  ): Promise<DoctorAvailableSlotsResponse> {
    const response = await api.get<{ success: boolean; data: DoctorAvailableSlotsResponse }>(
      `/admin/doctors/${doctorId}/available-slots`,
      { params: { date } }
    );
    return response.data.data;
  },

  async confirmReschedule(
    id: string,
    payload: { newDate: string; newTime: string; notes?: string }
  ): Promise<{ originalAppointmentId: string; newAppointmentId: string; newQueueNumber: number; newDate: string; newTime: string }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: {
        originalAppointmentId: string;
        newAppointmentId: string;
        newQueueNumber: number;
        newDate: string;
        newTime: string;
      };
    }>(`/admin/reschedule-requests/${id}/confirm`, payload);
    return response.data.data;
  },

  async rejectReschedule(id: string, rejectionReason: string): Promise<void> {
    await api.post(`/admin/reschedule-requests/${id}/reject`, { rejectionReason });
  },
};
