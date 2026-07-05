import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";
import { adminDoctorService, type AdminDoctorFilters } from "../services/adminDoctorService";

export const useAdminDoctorSummary = () => {
  return useQuery({
    queryKey: QUERY_KEYS.adminDoctorSummary,
    queryFn: adminDoctorService.getSummary,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminDoctors = (filters: AdminDoctorFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.adminDoctors({ ...filters }),
    queryFn: () => adminDoctorService.getDoctors(filters),
    staleTime: 5 * 60 * 1000,
  });
};
