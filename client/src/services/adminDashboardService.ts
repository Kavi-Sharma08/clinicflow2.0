import api from "../lib/axios";
import type { AdminDashboardSummaryDTO } from "../types/adminDashboard.types";
import type { ApiEnvelope } from "../types/doctor.types";

export const adminDashboardService = {
  async getSummary(): Promise<AdminDashboardSummaryDTO> {
    const response = await api.get<ApiEnvelope<AdminDashboardSummaryDTO>>("/admin/dashboard/summary");
    return response.data.data;
  },
};
