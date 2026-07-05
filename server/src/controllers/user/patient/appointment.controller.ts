import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { createNotification } from '../../../services/notification.service.js'
import { emitQueueUpdated } from '../../../services/realtime.service.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const normalizeDateRange = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

const combineDateAndTime = (date: Date, time: string) => {
  const [hours = '0', minutes = '0'] = time.split(':')
  const combined = new Date(date)
  combined.setUTCHours(Number(hours), Number(minutes), 0, 0)
  return combined
}

const getPatientProfile = async (userId: string) => {
  const profile = await prisma.patientProfile.findUnique({ where: { userId } })
  if (profile) return profile
  return prisma.patientProfile.create({
    data: { userId, patientId: `PT-${Date.now().toString(36).toUpperCase()}` },
  })
}

const serializeAppointment = (appointment: {
  id: string
  queueNumber: number
  status: string
  notes: string | null
  cancellationReason?: string | null
  appointmentDate: Date
  appointmentTime: Date
  consultationFee: { toString: () => string } | string | number
  createdAt: Date
  completedAt?: Date | null
  cancelledAt?: Date | null
  doctor: {
    id: string
    specializations: string[]
    department: string
    user: {
      firstName?: string | null
      middleName?: string | null
      lastName?: string | null
      email: string
      phone: string
      profileImage?: string | null
    }
  }
}) => ({
  id: appointment.id,
  queueNumber: appointment.queueNumber,
  status: appointment.status,
  notes: appointment.notes,
  cancellationReason: appointment.cancellationReason ?? null,
  appointmentDate: appointment.appointmentDate.toISOString(),
  appointmentTime: appointment.appointmentTime.toISOString(),
  consultationFee: Number(appointment.consultationFee),
  createdAt: appointment.createdAt.toISOString(),
  completedAt: appointment.completedAt?.toISOString() ?? null,
  cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
  doctor: {
    id: appointment.doctor.id,
    fullName: getUserDisplayName(appointment.doctor.user),
    email: appointment.doctor.user.email,
    phone: appointment.doctor.user.phone,
    specializations: appointment.doctor.specializations,
    specialization: appointment.doctor.specializations[0] ?? null,
    department: appointment.doctor.department,
    profileImage: appointment.doctor.user.profileImage ?? null,
  },
})

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { availabilityId, appointmentDate, notes, urgency } = req.body as {
      availabilityId?: string
      appointmentDate?: string
      notes?: string
      urgency?: 'ROUTINE' | 'URGENT'
    }
    const userId = req.user!.id

    if (!availabilityId || typeof availabilityId !== 'string') {
      return res.status(400).json({ success: false, field: 'availabilityId', message: 'availabilityId is required' })
    }
    if (!appointmentDate || typeof appointmentDate !== 'string') {
      return res.status(400).json({ success: false, field: 'appointmentDate', message: 'appointmentDate is required' })
    }

    const parsedDate = new Date(appointmentDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, field: 'appointmentDate', message: 'Invalid appointment date' })
    }

    const patientProfile = await getPatientProfile(userId)

    const result = await prisma.$transaction(async (tx) => {
      const availability = await tx.doctorAvailability.findUnique({
        where: { id: availabilityId },
        include: { doctor: { include: { user: true } } },
      })

      if (!availability || !availability.isAvailable) {
        throw { status: 404, message: 'Availability slot not found' }
      }

      const { start, end } = normalizeDateRange(parsedDate)

      const existingBooking = await tx.appointment.findFirst({
        where: {
          doctorId: availability.doctorId,
          patientId: patientProfile.id,
          appointmentDate: { gte: start, lt: end },
          status: 'BOOKED',
        },
      })

      if (existingBooking) {
        throw { status: 409, message: 'You already have an active booking with this doctor on this date' }
      }

      const activeCount = await tx.appointment.count({
        where: {
          doctorId: availability.doctorId,
          appointmentDate: { gte: start, lt: end },
          status: 'BOOKED',
        },
      })

      if (activeCount >= availability.maxAppointments) {
        throw { status: 409, message: 'This slot is fully booked' }
      }

      const lastIssued = await tx.appointment.aggregate({
        where: { doctorId: availability.doctorId, appointmentDate: { gte: start, lt: end } },
        _max: { queueNumber: true },
      })
      const nextQueueNumber = (lastIssued._max.queueNumber ?? 0) + 1

      return tx.appointment.create({
        data: {
          doctorId: availability.doctorId,
          patientId: patientProfile.id,
          appointmentDate: start,
          appointmentTime: combineDateAndTime(start, availability.startTime),
          queueNumber: nextQueueNumber,
          status: 'BOOKED',
          urgency: urgency === 'URGENT' ? 'URGENT' : 'ROUTINE',
          consultationFee: availability.doctor.consultationFee,
          notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        },
        include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
      })
    })

    await createNotification({
      recipientId: result.doctor.userId,
      type: 'APPOINTMENT_BOOKED',
      priority: result.urgency === 'URGENT' ? 'HIGH' : 'NORMAL',
      title: 'New appointment booked',
      message: `${getUserDisplayName(result.patient.user)} booked queue #${result.queueNumber} for ${result.appointmentDate.toISOString().slice(0, 10)}.`,
      entityType: 'appointment',
      entityId: result.id,
      metadata: { queueNumber: result.queueNumber, appointmentDate: result.appointmentDate.toISOString() },
    })
    await createNotification({
      recipientId: result.patient.userId,
      type: 'APPOINTMENT_BOOKED',
      title: 'Appointment confirmed',
      message: `Your appointment with Dr. ${getUserDisplayName(result.doctor.user)} is confirmed. Queue #${result.queueNumber}.`,
      entityType: 'appointment',
      entityId: result.id,
      metadata: { queueNumber: result.queueNumber, appointmentDate: result.appointmentDate.toISOString() },
    })
    emitQueueUpdated(result.doctor.userId, { appointmentId: result.id, queueNumber: result.queueNumber, status: result.status })

    return res.status(201).json({ success: true, message: 'Appointment booked', data: serializeAppointment(result) })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({ success: false, message: typed.message ?? 'Unable to book appointment' })
    }
    console.error('Book appointment error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const patientProfile = await getPatientProfile(req.user!.id)

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientProfile.id },
      include: { doctor: { include: { user: true } } },
      orderBy: [{ appointmentDate: 'desc' }, { queueNumber: 'asc' }],
    })

    return res.status(200).json({ success: true, data: appointments.map(serializeAppointment) })
  } catch (error) {
    console.error('Get my appointments error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { cancellationReason } = req.body as { cancellationReason?: string }
    const patientProfile = await getPatientProfile(req.user!.id)

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' })
    }
    if (!cancellationReason || !cancellationReason.trim()) {
      return res.status(400).json({ success: false, field: 'cancellationReason', message: "Please let us know why you're cancelling." })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    if (appointment.patientId !== patientProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot cancel this appointment' })
    }

    if (appointment.status !== 'BOOKED') {
      return res.status(409).json({ success: false, message: `Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}` })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: cancellationReason.trim(), cancelledAt: new Date() },
      include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
    })

    await createNotification({
      recipientId: updated.doctor.userId,
      type: 'APPOINTMENT_CANCELLED',
      priority: 'HIGH',
      title: 'Appointment cancelled',
      message: `${getUserDisplayName(updated.patient.user)} cancelled queue #${updated.queueNumber}.`,
      entityType: 'appointment',
      entityId: updated.id,
    })
    await createNotification({
      recipientId: updated.patient.userId,
      type: 'APPOINTMENT_CANCELLED',
      title: 'Appointment cancelled',
      message: `Your appointment with Dr. ${getUserDisplayName(updated.doctor.user)} has been cancelled.`,
      entityType: 'appointment',
      entityId: updated.id,
    })
    emitQueueUpdated(updated.doctor.userId, { appointmentId: updated.id, queueNumber: updated.queueNumber, status: updated.status })

    return res.status(200).json({ success: true, message: 'Appointment cancelled', data: serializeAppointment(updated) })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
