import api from '../lib/axios'
import type {
  CreateGuestBookingPayload,
  GuestAppointmentDetailsDTO,
  GuestBookingConfirmationDTO,
  GuestWalkInConfirmationDTO,
  JoinWalkInQueuePayload,
  PublicDoctorAvailabilityDTO,
  PublicDoctorProfileDTO,
} from '../types/guestBooking.types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export const guestBookingService = {
  async getDoctorPublicProfile(identifier: string): Promise<PublicDoctorProfileDTO> {
    const response = await api.get<ApiResponse<PublicDoctorProfileDTO>>(`/public/doctors/${identifier}`)
    return response.data.data
  },

  async getDoctorPublicAvailability(identifier: string): Promise<PublicDoctorAvailabilityDTO> {
    const response = await api.get<ApiResponse<PublicDoctorAvailabilityDTO>>(`/public/doctors/${identifier}/availability`)
    return response.data.data
  },

  async createGuestBooking(payload: CreateGuestBookingPayload): Promise<GuestBookingConfirmationDTO> {
    const response = await api.post<ApiResponse<GuestBookingConfirmationDTO>>('/public/appointments/book', payload)
    return response.data.data
  },

  async joinWalkInQueue(payload: JoinWalkInQueuePayload): Promise<GuestWalkInConfirmationDTO> {
    const response = await api.post<ApiResponse<GuestWalkInConfirmationDTO>>('/public/queue/join-walkin', payload)
    return response.data.data
  },

  async getGuestAppointment(token: string): Promise<GuestAppointmentDetailsDTO> {
    const response = await api.get<ApiResponse<GuestAppointmentDetailsDTO>>(`/public/appointments/manage/${token}`)
    return response.data.data
  },

  async cancelGuestAppointment(token: string, cancellationReason: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/public/appointments/manage/${token}/cancel`,
      { cancellationReason }
    )
    return response.data.data
  },

  async rescheduleGuestAppointment(
    token: string,
    newAvailabilityId: string,
    newAppointmentDate: string
  ): Promise<{ success: boolean; message: string; appointmentId: string; newAppointmentDate: string; newQueueNumber: number }> {
    const response = await api.post<ApiResponse<{ success: boolean; message: string; appointmentId: string; newAppointmentDate: string; newQueueNumber: number }>>(
      `/public/appointments/manage/${token}/reschedule`,
      { newAvailabilityId, newAppointmentDate }
    )
    return response.data.data
  },
}
