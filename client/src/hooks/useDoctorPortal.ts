import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { doctorPortalService } from "../services/doctorPortalService";
import { handleFormError } from "../utils/handleFormError";
import { showErrorToast } from "../utils/errorUtils";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type {
  AppointmentStatus,
  AvailabilityFormValues,
  DoctorAppointmentFilters,
  DoctorAvailabilityDTO,
  DoctorProfilePayload,
} from "../types/doctorPortal.types";
import type { UseFormSetError } from "react-hook-form";

// ── Query Keys ─────────────────────────────────────────────────────────────
export const DOCTOR_PORTAL_KEYS = {
  dashboard: ["doctor", "dashboard"] as const,
  profile: ["doctor", "profile"] as const,
  availability: ["doctor", "availability"] as const,
  appointments: (filters: DoctorAppointmentFilters) =>
    ["doctor", "appointments", filters] as const,
};

// ── Dashboard ──────────────────────────────────────────────────────────────
export const useDoctorDashboardSummary = () =>
  useQuery({
    queryKey: DOCTOR_PORTAL_KEYS.dashboard,
    queryFn: doctorPortalService.getDashboardSummary,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

// ── Profile ────────────────────────────────────────────────────────────────
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
    mutationFn: (payload: DoctorProfilePayload) =>
      doctorPortalService.updateMyProfile(payload),
    onSuccess: () => {
      toast.success("Profile submitted for admin review.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error) => {
      showErrorToast(error, ERROR_MESSAGES.PROFILE.UPDATE_FAILED);
    },
  });
};

// ── Availability ───────────────────────────────────────────────────────────
export const useDoctorAvailability = () =>
  useQuery<DoctorAvailabilityDTO[]>({
    queryKey: DOCTOR_PORTAL_KEYS.availability,
    queryFn: doctorPortalService.getAvailabilityList,
    staleTime: 5 * 60_000,
  });

export const useCreateAvailability = (
  setError: UseFormSetError<AvailabilityFormValues>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doctorPortalService.createAvailability,
    onSuccess: () => {
      toast.success("Availability slot created.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error) => handleFormError(error, setError),
  });
};

export const useUpdateDoctorAvailability = (
  setError?: UseFormSetError<AvailabilityFormValues>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<DoctorAvailabilityDTO, "id">>;
    }) => doctorPortalService.updateAvailability(id, payload),
    onSuccess: () => {
      toast.success("Availability slot updated.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error) => {
      if (setError) {
        handleFormError(error, setError);
      } else {
        showErrorToast(error, ERROR_MESSAGES.DOCTOR.AVAILABILITY_UPDATE_FAILED);
      }
    },
  });
};

export const useDeleteAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorPortalService.deleteAvailability(id),
    onSuccess: () => {
      toast.success("Availability slot removed.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error) => {
      showErrorToast(error, ERROR_MESSAGES.DOCTOR.AVAILABILITY_DELETE_FAILED);
    },
  });
};

// ── Appointments ───────────────────────────────────────────────────────────
export const useDoctorAppointments = (filters: DoctorAppointmentFilters) =>
  useQuery({
    queryKey: DOCTOR_PORTAL_KEYS.appointments(filters),
    queryFn: () => doctorPortalService.getAppointments(filters),
    staleTime: 60_000,
  });

export const useUpdateDoctorAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      cancellationReason,
    }: {
      id: string;
      status: AppointmentStatus;
      cancellationReason?: string;
    }) =>
      doctorPortalService.updateAppointmentStatus(id, status, cancellationReason),
    onSuccess: () => {
      toast.success("Appointment status updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error) => {
      showErrorToast(error, ERROR_MESSAGES.APPOINTMENT.STATUS_UPDATE_FAILED);
    },
  });
};

export const useAppointmentFilterOptions = (date: string | undefined, field: string | undefined, query: string) =>
  useQuery({
    queryKey: ["doctor", "appointments", "filter-options", date, field, query],
    queryFn: () => doctorPortalService.getAppointmentFilterOptions(date!, field!, query),
    enabled: !!date && !!field,
    staleTime: 60_000,
  });

export const useDoctorLiveQueue = (date?: string) =>
  useQuery({
    queryKey: ["doctor-live-queue", date],
    queryFn: () => doctorPortalService.getLiveQueue(date),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

export const useStartConsultation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorPortalService.startConsultation(id),
    onSuccess: () => {
      toast.success("Consultation started.");
      queryClient.invalidateQueries({ queryKey: ["doctor-live-queue"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? "Unable to start consultation.");
    },
  });
};

export const useCompleteConsultation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorPortalService.completeConsultation(id),
    onSuccess: () => {
      toast.success("Consultation completed.");
      queryClient.invalidateQueries({ queryKey: ["doctor-live-queue"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? "Unable to complete consultation.");
    },
  });
};

export const useMarkNoShow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorPortalService.markNoShow(id),
    onSuccess: () => {
      toast.success("Marked patient as no-show.");
      queryClient.invalidateQueries({ queryKey: ["doctor-live-queue"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? "Unable to mark no-show.");
    },
  });
};
