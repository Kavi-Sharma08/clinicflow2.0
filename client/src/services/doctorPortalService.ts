import api from "../lib/axios";
import type {
  AppointmentStatus,
  CreateAvailabilityPayload,
  DoctorAppointmentFilters,
  DoctorAvailabilityDTO,
  DoctorDashboardSummaryDTO,
  DoctorProfileDTO,
  DoctorProfilePayload,
  PaginatedDoctorAppointmentsDTO,
  AutocompleteOption,
  QueueSnapshot,
  DoctorQrCodeDTO,
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

  async createAvailability(payload: CreateAvailabilityPayload): Promise<DoctorAvailabilityDTO> {
    const response = await api.post<ApiResponse<DoctorAvailabilityDTO>>("/doctor/availability", payload);
    return response.data.data;
  },

  async updateAvailability(id: string, payload: Partial<CreateAvailabilityPayload>): Promise<DoctorAvailabilityDTO> {
    const response = await api.put<ApiResponse<DoctorAvailabilityDTO>>(`/doctor/availability/${id}`, payload);
    return response.data.data;
  },

  async deleteAvailability(id: string): Promise<void> {
    await api.delete(`/doctor/availability/${id}`);
  },

  async getAppointments(filters: DoctorAppointmentFilters): Promise<PaginatedDoctorAppointmentsDTO> {
    let finalFilters = filters.filters;
    if (filters.status && filters.status !== "ALL" && !finalFilters) {
      finalFilters = JSON.stringify([{ field: "status", operator: "EQUALS", value: filters.status }]);
    }
    const response = await api.get<PaginatedDoctorAppointmentsDTO>("/doctor/appointments", {
      params: {
        date: filters.date,
        page: filters.page,
        limit: filters.limit,
        filters: finalFilters,
      },
    });
    return response.data;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus, cancellationReason?: string): Promise<void> {
    await api.patch(`/doctor/appointments/${id}/status`, { status, cancellationReason });
  },

  async getAppointmentFilterOptions(date: string, field: string, query: string): Promise<AutocompleteOption[]> {
    if (!date || !field) return [];
    const response = await api.get<ApiResponse<AutocompleteOption[]>>("/doctor/appointments/filter-options", {
      params: { date, field, q: query },
    });
    return response.data.data;
  },

  async getLiveQueue(date?: string): Promise<QueueSnapshot> {
    const response = await api.get<ApiResponse<QueueSnapshot>>("/doctor/queue", {
      params: { date },
    });
    return response.data.data;
  },

  async startConsultation(id: string): Promise<void> {
    await api.post(`/doctor/appointments/${id}/start`);
  },

  async completeConsultation(id: string): Promise<void> {
    await api.post(`/doctor/appointments/${id}/complete`);
  },

  async markNoShow(id: string): Promise<void> {
    await api.post(`/doctor/appointments/${id}/no-show`);
  },

  async getDoctorQrCode(): Promise<DoctorQrCodeDTO> {
    const response = await api.get<ApiResponse<DoctorQrCodeDTO>>('/doctor/qr-code');
    return response.data.data;
  },

  async getPayoutsSummary(): Promise<{
    totalGrossPaise: number;
    totalPlatformFeePaise: number;
    totalAllocatedPaise: number;
    eligiblePaise: number;
    pendingCompletionPaise: number;
    onHoldPaise: number;
    settledPaise: number;
    currency: string;
  }> {
    const response = await api.get<ApiResponse<{
      summary: {
        totalGrossPaise: number;
        totalPlatformFeePaise: number;
        totalAllocatedPaise: number;
        eligiblePaise: number;
        pendingCompletionPaise: number;
        onHoldPaise: number;
        settledPaise: number;
        currency: string;
      };
    }>>('/doctor/payouts/summary');
    return response.data.data.summary;
  },

  async getPayoutTransactions(page: number = 1, limit: number = 15): Promise<{
    transactions: Array<{
      id: string;
      allocatedAmountPaise: number;
      settlementStatus: string;
      payoutReference?: string | null;
      transferSettledAt?: string | null;
      createdAt: string;
      appointment: {
        id: string;
        appointmentDate: string;
        queueNumber?: number | null;
        status: string;
        isGuest: boolean;
        guestName?: string | null;
        patient?: {
          user: {
            firstName: string;
            lastName: string;
          };
        } | null;
      };
      paymentOrder: {
        razorpayOrderId: string;
        grossAmountPaise: number;
        platformFeePaise: number;
        doctorSharePaise: number;
        currency: string;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const response = await api.get<ApiResponse<{
      transactions: any[];
      pagination: any;
    }>>('/doctor/payouts/transactions', {
      params: { page, limit },
    });
    return response.data.data;
  },
};
