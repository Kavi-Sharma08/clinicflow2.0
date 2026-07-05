import api from "../lib/axios";
import type {
  AppointmentUrgency,
  PatientAppointment,
  PatientAvailabilitySlot,
  PatientDashboardSummary,
  PatientDoctor,
  PatientProfile,
  PatientProfilePayload,
} from "../types/patientPortal.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DoctorSearchParams {
  search?: string;
  specialization?: string | null;
  date?: string | null;
}

export const patientPortalService = {
  async getDashboardSummary(): Promise<PatientDashboardSummary> {
    const response = await api.get<ApiResponse<PatientDashboardSummary>>("/patient/dashboard/summary");
    return response.data.data;
  },

  async getProfile(): Promise<PatientProfile> {
    const response = await api.get<ApiResponse<PatientProfile>>("/patient/profile/me");
    return response.data.data;
  },

  async updateProfile(payload: PatientProfilePayload): Promise<void> {
    await api.put("/patient/profile/me", payload);
  },

  async getDoctors(params: DoctorSearchParams): Promise<PatientDoctor[]> {
    const response = await api.get<ApiResponse<PatientDoctor[]>>("/patient/doctors", { params });
    return response.data.data;
  },

  async getSpecializations(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>("/patient/doctors/specializations");
    return response.data.data;
  },

  async getDoctorAvailability(doctorId: string): Promise<PatientAvailabilitySlot[]> {
    const response = await api.get<ApiResponse<PatientAvailabilitySlot[]>>(`/patient/doctors/${doctorId}/availability`);
    return response.data.data;
  },

  async bookAppointment(payload: { availabilityId: string; appointmentDate: string; notes: string; urgency: AppointmentUrgency }): Promise<PatientAppointment> {
    const response = await api.post<ApiResponse<PatientAppointment>>("/patient/appointments", payload);
    return response.data.data;
  },

  async getMyAppointments(): Promise<PatientAppointment[]> {
    const response = await api.get<ApiResponse<PatientAppointment[]>>("/patient/appointments/me");
    return response.data.data;
  },

  async cancelAppointment(payload: { id: string; cancellationReason: string }): Promise<PatientAppointment> {
    const response = await api.patch<ApiResponse<PatientAppointment>>(`/patient/appointments/${payload.id}/cancel`, {
      cancellationReason: payload.cancellationReason,
    });
    return response.data.data;
  },
};
