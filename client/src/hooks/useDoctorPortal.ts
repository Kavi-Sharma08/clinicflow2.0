import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { doctorPortalService } from "../services/doctorPortalService";
import type { AppointmentStatus, DoctorAppointmentFilters, DoctorProfilePayload, DoctorAvailabilityDTO } from "../types/doctorPortal.types";

export const DOCTOR_PORTAL_KEYS = {
  dashboard: ["doctor", "dashboard"] as const,
  profile: ["doctor", "profile"] as const,
  availability: ["doctor", "availability"] as const,
  appointments: (filters: DoctorAppointmentFilters) => ["doctor", "appointments", filters] as const,
};

export const useDoctorDashboardSummary = () =>
  useQuery({
    queryKey: DOCTOR_PORTAL_KEYS.dashboard,
    queryFn: doctorPortalService.getDashboardSummary,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

export const useDoctorProfile = () =>
  useQuery({
    queryKey: DOCTOR_PORTAL_KEYS.profile,
    queryFn: doctorPortalService.getMyProfile,
    staleTime: 5 * 60_000,
    retry: false,
  });

export const useUpdateDoctorProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DoctorProfilePayload) => doctorPortalService.updateMyProfile(payload),
    onSuccess: () => {
      toast.success("Profile submitted for admin review.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
  });
};

export const useUpdateDoctorAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Omit<DoctorAvailabilityDTO, "id" | "bookedCount">;
    }) => doctorPortalService.updateAvailability(id, payload),
    onSuccess: () => {
      toast.success("Availability slot updated.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
  });
};

export const useDoctorAvailability = () =>
  useQuery({
    queryKey: DOCTOR_PORTAL_KEYS.availability,
    queryFn: doctorPortalService.getAvailabilityList,
    staleTime: 5 * 60_000,
  });

export const useDoctorAppointments = (filters: DoctorAppointmentFilters) =>
  useQuery({
    queryKey: DOCTOR_PORTAL_KEYS.appointments(filters),
    queryFn: () => doctorPortalService.getAppointments(filters),
    staleTime: 60_000,
  });

export const useUpdateDoctorAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: AppointmentStatus; cancellationReason?: string }) =>
      doctorPortalService.updateAppointmentStatus(id, status, cancellationReason),
    onSuccess: () => {
      toast.success("Appointment updated.");
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
  });
};
