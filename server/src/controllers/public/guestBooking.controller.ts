import { type Request, type Response } from 'express'
import {
  cancelGuestAppointment,
  createGuestBooking,
  getGuestAppointmentByToken,
  getPublicDoctorAvailability,
  getPublicDoctorProfile,
  joinWalkInQueue,
  rescheduleGuestAppointment,
} from '../../services/guestBooking.service.js'

// ── Validation Helpers ───────────────────────────────────────────────

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

// ── Public Controllers ───────────────────────────────────────────────

export const getDoctorPublicProfileController = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ success: false, message: 'Doctor identifier is required' })
    }

    const profile = await getPublicDoctorProfile(identifier)
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found or is currently not verified to accept public bookings.',
      })
    }

    return res.status(200).json({ success: true, data: profile })
  } catch (error) {
    console.error('Get doctor public profile error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getDoctorPublicAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ success: false, message: 'Doctor identifier is required' })
    }

    const availability = await getPublicDoctorAvailability(identifier)
    if (!availability) {
      return res.status(404).json({ success: false, message: 'Doctor schedule not found or unavailable' })
    }

    return res.status(200).json({ success: true, data: availability })
  } catch (error) {
    console.error('Get doctor public availability error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const createGuestBookingController = async (req: Request, res: Response) => {
  try {
    const { doctorIdentifier, availabilityId, appointmentDate, guestName, guestPhone, guestEmail, notes } = req.body

    // Server-side field validations
    if (!doctorIdentifier || typeof doctorIdentifier !== 'string') {
      return res.status(400).json({ success: false, field: 'doctorIdentifier', message: 'Doctor identifier is required' })
    }
    if (!availabilityId || typeof availabilityId !== 'string') {
      return res.status(400).json({ success: false, field: 'availabilityId', message: 'Please select an appointment time slot' })
    }
    if (!appointmentDate || typeof appointmentDate !== 'string') {
      return res.status(400).json({ success: false, field: 'appointmentDate', message: 'Please select an appointment date' })
    }
    if (!guestName || typeof guestName !== 'string' || guestName.trim().length < 2) {
      return res.status(400).json({ success: false, field: 'guestName', message: 'Please provide your full name (minimum 2 characters)' })
    }
    if (!guestPhone || typeof guestPhone !== 'string' || !isValidPhone(guestPhone)) {
      return res.status(400).json({ success: false, field: 'guestPhone', message: 'Please provide a valid phone number (at least 8 digits)' })
    }
    if (!guestEmail || typeof guestEmail !== 'string' || !isValidEmail(guestEmail)) {
      return res.status(400).json({ success: false, field: 'guestEmail', message: 'Please provide a valid email address for confirmation & management' })
    }
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
      return res.status(400).json({ success: false, field: 'notes', message: 'Visit notes must not exceed 500 characters' })
    }

    const result = await createGuestBooking({
      doctorIdentifier,
      availabilityId,
      appointmentDate,
      guestName,
      guestPhone,
      guestEmail,
      notes,
    })

    return res.status(201).json({
      success: true,
      message: 'Appointment successfully confirmed!',
      data: result,
    })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({ success: false, message: typed.message })
    }
    console.error('Guest booking error:', error)
    return res.status(500).json({ success: false, message: 'Failed to create guest booking. Please try again.' })
  }
}

export const joinWalkInQueueController = async (req: Request, res: Response) => {
  try {
    const { doctorIdentifier, guestName, guestPhone, guestEmail, notes } = req.body

    if (!doctorIdentifier || typeof doctorIdentifier !== 'string') {
      return res.status(400).json({ success: false, field: 'doctorIdentifier', message: 'Doctor identifier is required' })
    }
    if (!guestName || typeof guestName !== 'string' || guestName.trim().length < 2) {
      return res.status(400).json({ success: false, field: 'guestName', message: 'Please provide your full name' })
    }
    if (!guestPhone || typeof guestPhone !== 'string' || !isValidPhone(guestPhone)) {
      return res.status(400).json({ success: false, field: 'guestPhone', message: 'Please provide a valid phone number' })
    }
    if (!guestEmail || typeof guestEmail !== 'string' || !isValidEmail(guestEmail)) {
      return res.status(400).json({ success: false, field: 'guestEmail', message: 'Please provide a valid email address' })
    }
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
      return res.status(400).json({ success: false, field: 'notes', message: 'Visit reason must not exceed 500 characters' })
    }

    const result = await joinWalkInQueue({
      doctorIdentifier,
      guestName,
      guestPhone,
      guestEmail,
      notes,
    })

    return res.status(201).json({
      success: true,
      message: "Successfully joined today's walk-in queue!",
      data: result,
    })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({ success: false, message: typed.message })
    }
    console.error('Join walk-in error:', error)
    return res.status(500).json({ success: false, message: "Failed to join today's queue. Please try again." })
  }
}

export const getGuestAppointmentController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Management token is required' })
    }

    const appointment = await getGuestAppointmentByToken(token)
    return res.status(200).json({ success: true, data: appointment })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({ success: false, message: typed.message })
    }
    console.error('Get guest appointment by token error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const cancelGuestAppointmentController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const { cancellationReason } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Management token is required' })
    }
    if (!cancellationReason || typeof cancellationReason !== 'string' || !cancellationReason.trim()) {
      return res.status(400).json({ success: false, field: 'cancellationReason', message: 'Please provide a reason for cancellation' })
    }

    const result = await cancelGuestAppointment(token, cancellationReason)
    return res.status(200).json({ success: true, message: 'Appointment successfully cancelled', data: result })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({ success: false, message: typed.message })
    }
    console.error('Cancel guest appointment error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const rescheduleGuestAppointmentController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const { newAvailabilityId, newAppointmentDate } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Management token is required' })
    }
    if (!newAvailabilityId || typeof newAvailabilityId !== 'string') {
      return res.status(400).json({ success: false, field: 'newAvailabilityId', message: 'Please select a new time slot' })
    }
    if (!newAppointmentDate || typeof newAppointmentDate !== 'string') {
      return res.status(400).json({ success: false, field: 'newAppointmentDate', message: 'Please select a new appointment date' })
    }

    const result = await rescheduleGuestAppointment({
      rawToken: token,
      newAvailabilityId,
      newAppointmentDate,
    })

    return res.status(200).json({ success: true, message: 'Appointment successfully rescheduled', data: result })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({ success: false, message: typed.message })
    }
    console.error('Reschedule guest appointment error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
