import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAppointmentService } from '../services/adminAppointmentService';
import type {
  AdminAppointmentFilters,
  AppointmentStatus,
} from '../types/adminAppointment.types';
import { showErrorToast } from '../utils/errorUtils';
import { ERROR_MESSAGES } from '../constants/errorMessages';

export const ADMIN_APPOINTMENT_KEYS = {
  list: (filters: AdminAppointmentFilters) => ['admin-appointments', filters] as const,
  stats: ['admin-appointment-stats'] as const,
  detail: (id: string) => ['admin-appointment-detail', id] as const,
  rescheduleRequests: (params: Record<string, unknown>) => ['admin-reschedule-requests', params] as const,
  availableSlots: (doctorId: string, date: string) => ['doctor-available-slots', doctorId, date] as const,
};

export const useAdminAppointments = (filters: AdminAppointmentFilters = {}) => {
  return useQuery({
    queryKey: ADMIN_APPOINTMENT_KEYS.list(filters),
    queryFn: () => adminAppointmentService.getAppointments(filters),
    staleTime: 15_000,
  });
};

export const useAdminAppointmentStats = () => {
  return useQuery({
    queryKey: ADMIN_APPOINTMENT_KEYS.stats,
    queryFn: () => adminAppointmentService.getAppointmentStats(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};

export const useAdminAppointmentDetail = (id?: string) => {
  return useQuery({
    queryKey: ADMIN_APPOINTMENT_KEYS.detail(id || ''),
    queryFn: () => adminAppointmentService.getAppointmentDetail(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
};

export const useUpdateAdminAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
      cancellationReason,
    }: {
      id: string;
      status: AppointmentStatus;
      notes?: string;
      cancellationReason?: string;
    }) => adminAppointmentService.updateAppointmentStatus(id, status, notes, cancellationReason),
    onSuccess: (updated) => {
      toast.success(`Appointment status updated to ${updated.status.replace('_', ' ')}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_APPOINTMENT_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ADMIN_APPOINTMENT_KEYS.detail(updated.id) });
    },
    onError: (error) => {
      showErrorToast(error, ERROR_MESSAGES.APPOINTMENT.STATUS_UPDATE_FAILED);
    },
  });
};

export const useAdminRescheduleRequests = (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}) => {
  return useQuery({
    queryKey: ADMIN_APPOINTMENT_KEYS.rescheduleRequests(params),
    queryFn: () => adminAppointmentService.getRescheduleRequests(params),
    staleTime: 15_000,
  });
};

export const useDoctorAvailableSlots = (doctorId?: string, date?: string) => {
  return useQuery({
    queryKey: ADMIN_APPOINTMENT_KEYS.availableSlots(doctorId || '', date || ''),
    queryFn: () => adminAppointmentService.getDoctorAvailableSlots(doctorId!, date!),
    enabled: !!doctorId && !!date,
    staleTime: 10_000,
  });
};

export const useConfirmReschedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      newDate,
      newTime,
      notes,
    }: {
      id: string;
      newDate: string;
      newTime: string;
      notes?: string;
    }) => adminAppointmentService.confirmReschedule(id, { newDate, newTime, notes }),
    onSuccess: () => {
      toast.success('Appointment successfully rescheduled!');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_APPOINTMENT_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ['admin-reschedule-requests'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-available-slots'] });
    },
    onError: (error) => {
      showErrorToast(error, ERROR_MESSAGES.APPOINTMENT.RESCHEDULE_CONFIRM_FAILED);
    },
  });
};

export const useRejectReschedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      adminAppointmentService.rejectReschedule(id, rejectionReason),
    onSuccess: () => {
      toast.success('Reschedule request rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_APPOINTMENT_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ['admin-reschedule-requests'] });
    },
    onError: (error) => {
      showErrorToast(error, ERROR_MESSAGES.APPOINTMENT.RESCHEDULE_REJECT_FAILED);
    },
  });
};
