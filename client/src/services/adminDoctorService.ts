import api from "../lib/axios";
import type {
  AdminDoctorsResponseDTO,
  AdminDoctorSummaryDTO,
  DoctorListStatus,
} from "../types/adminDoctorList.types";
import type { AdminDoctorDetailDTO, ApiEnvelope } from "../types/doctor.types";

export interface AdminDoctorFilters {
  skip: number;
  limit: number;
  status: DoctorListStatus;
  search?: string;
  department?: string;
  specialization?: string;
  sortBy: "NAME" | "CREATED_AT" | "STATUS";
  sortOrder: "asc" | "desc";
}

export const adminDoctorService = {
  async getDoctorDetail(doctorUserId: string): Promise<AdminDoctorDetailDTO> {
    const response = await api.get<ApiEnvelope<AdminDoctorDetailDTO>>(`/admin/doctors/${doctorUserId}`);
    return response.data.data;
  },

  async verifyDoctor(doctorProfileId: string): Promise<{ id: string; verificationStatus: string }> {
    const response = await api.put<ApiEnvelope<{ id: string; verificationStatus: string }>>(`/admin/doctors/${doctorProfileId}/approve`);
    return response.data.data;
  },

  async rejectDoctor(doctorProfileId: string, reason: string): Promise<{ id: string; verificationStatus: string }> {
    const response = await api.put<ApiEnvelope<{ id: string; verificationStatus: string }>>(`/admin/doctors/${doctorProfileId}/reject`, { reason });
    return response.data.data;
  },

  async getSummary(): Promise<AdminDoctorSummaryDTO> {
    const response = await api.get<ApiEnvelope<AdminDoctorSummaryDTO>>("/admin/doctors/summary");
    return response.data.data;
  },

  async getDoctors(filters: AdminDoctorFilters): Promise<AdminDoctorsResponseDTO> {
    const response = await api.get<AdminDoctorsResponseDTO>("/admin/doctors", {
      params: filters,
    });
    return response.data;
  },
};
