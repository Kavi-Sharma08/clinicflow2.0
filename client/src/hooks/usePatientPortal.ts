import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientPortalService, type DoctorSearchParams } from "../services/patientPortalService";
import type { PatientProfilePayload } from "../types/patientPortal.types";

export const usePatientDashboard = () =>
  useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: patientPortalService.getDashboardSummary,
    staleTime: 60_000,
  });

export const usePatientProfile = () =>
  useQuery({
    queryKey: ["patient-profile"],
    queryFn: patientPortalService.getProfile,
    staleTime: 5 * 60_000,
  });

export const useUpdatePatientProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatientProfilePayload) => patientPortalService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
    },
  });
};

export const usePatientDoctors = (params: DoctorSearchParams) =>
  useQuery({
    queryKey: ["patient-doctors", params],
    queryFn: () => patientPortalService.getDoctors(params),
    staleTime: 2 * 60_000,
  });

export const usePatientSpecializations = () =>
  useQuery({
    queryKey: ["patient-specializations"],
    queryFn: patientPortalService.getSpecializations,
    staleTime: 30 * 60_000,
  });

export const usePatientDoctorAvailability = (doctorId: string | null) =>
  useQuery({
    queryKey: ["patient-doctor-availability", doctorId],
    queryFn: () => patientPortalService.getDoctorAvailability(doctorId!),
    enabled: Boolean(doctorId),
    staleTime: 30_000,
  });

export const usePatientAppointments = () =>
  useQuery({
    queryKey: ["patient-appointments"],
    queryFn: patientPortalService.getMyAppointments,
    staleTime: 30_000,
  });

export const useBookPatientAppointment = (doctorId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientPortalService.bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["patient-doctor-availability", doctorId] });
    },
  });
};

export const useCancelPatientAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientPortalService.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
    },
  });
};

export const useAppointmentQueueStatus = (appointmentId: string | null) =>
  useQuery({
    queryKey: ["patient-queue-status", appointmentId],
    queryFn: () => patientPortalService.getAppointmentQueueStatus(appointmentId!),
    enabled: Boolean(appointmentId),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
