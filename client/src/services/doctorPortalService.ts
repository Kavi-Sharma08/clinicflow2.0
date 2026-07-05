import api from "../lib/axios";
import type {
  AppointmentStatus,
  DoctorAppointmentFilters,
  DoctorDashboardSummaryDTO,
  DoctorProfileDTO,
  DoctorProfilePayload,
  PaginatedDoctorAppointmentsDTO,
  DoctorAvailabilityDTO,
} from "../types/doctorPortal.types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const doctorPortalService = {
  async getDashboardSummary(): Promise<DoctorDashboardSummaryDTO> {
    const response = await api.get<ApiResponse<DoctorDashboardSummaryDTO>>("/doctor/dashboard/summary");
    return response.data.data;
  },

  async getMyProfile(): Promise<DoctorProfileDTO> {
    const response = await api.get<ApiResponse<DoctorProfileDTO>>("/doctor/profile/me");
    return response.data.data;
  },

  async updateMyProfile(payload: DoctorProfilePayload): Promise<DoctorProfileDTO> {
    const response = await api.put<ApiResponse<DoctorProfileDTO>>("/doctor/profile/me", payload);
    return response.data.data;
  },

  async getAvailabilityList(): Promise<DoctorAvailabilityDTO[]> {
    const response = await api.get<ApiResponse<DoctorAvailabilityDTO[]>>("/doctor/availability/list");
    return response.data.data;
  },

  async createAvailability(payload: Omit<DoctorAvailabilityDTO, "id">): Promise<DoctorAvailabilityDTO> {
    const response = await api.post<ApiResponse<DoctorAvailabilityDTO>>("/doctor/availability", payload);
    return response.data.data;
  },

  async updateAvailability(id: string, payload: Partial<Omit<DoctorAvailabilityDTO, "id">>): Promise<DoctorAvailabilityDTO> {
    const response = await api.put<ApiResponse<DoctorAvailabilityDTO>>(`/doctor/availability/${id}`, payload);
    return response.data.data;
  },

  async deleteAvailability(id: string): Promise<void> {
    await api.delete(`/doctor/availability/${id}`);
  },

  async getAppointments(filters: DoctorAppointmentFilters): Promise<PaginatedDoctorAppointmentsDTO> {
    const response = await api.get<PaginatedDoctorAppointmentsDTO>("/doctor/appointments", {
      params: {
        ...filters,
        status: filters.status === "ALL" ? undefined : filters.status,
      },
    });
    return response.data;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus, cancellationReason?: string): Promise<void> {
    await api.patch(`/doctor/appointments/${id}/status`, { status, cancellationReason });
  },
};
