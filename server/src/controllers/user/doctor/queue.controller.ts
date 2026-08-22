import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import {
  getLiveQueueSnapshot,
  normalizeDateRange,
  recalculateQueue,
  serializeQueueAppointment,
} from '../../../services/queue.service.js'
import { createNotification } from '../../../services/notification.service.js'
import { emitQueueUpdated, getRealtimeServer } from '../../../services/realtime.service.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const getDoctorProfile = async (userId: string) =>
  prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true, userId: true } })

export const getLiveQueue = async (req: Request, res: Response) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const { date } = req.query
    const dateStr = typeof date === 'string' ? date : undefined
    const targetDate = dateStr ? new Date(dateStr) : new Date()
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date parameter.' })
    }

    await recalculateQueue(doctorProfile.id, targetDate)
    const snapshot = await getLiveQueueSnapshot(doctorProfile.id, targetDate)

    return res.status(200).json({ success: true, data: snapshot })
  } catch (error) {
    console.error('Get live queue error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const startConsultation = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : undefined
    if (!id) {
      return res.status(400).json({ success: false, message: 'Appointment id is required' })
    }

    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.doctorId !== doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot update this appointment' })
    }
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
      return res.status(409).json({ success: false, message: `Cannot start consultation for an appointment that is ${appointment.status.toLowerCase()}` })
    }

    const { start, end } = normalizeDateRange(appointment.appointmentDate)

    const existingActive = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorProfile.id,
        appointmentDate: { gte: start, lt: end },
        status: 'IN_CONSULTATION',
        NOT: { id: appointment.id },
      },
    })

    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: `Queue #${existingActive.queueNumber} is currently in consultation. Complete or mark it before starting a new consultation.`,
      })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'IN_CONSULTATION',
        actualStartTime: new Date(),
      },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })

    await recalculateQueue(doctorProfile.id, appointment.appointmentDate)

    await createNotification({
      recipientId: updated.patient.userId,
      type: 'APPOINTMENT_STARTED',
      priority: 'HIGH',
      title: 'Consultation started',
      message: `Dr. ${getUserDisplayName(updated.doctor.user)} is ready for you now (Queue #${updated.queueNumber}).`,
      entityType: 'appointment',
      entityId: updated.id,
      metadata: { status: updated.status, queueNumber: updated.queueNumber },
    })

    emitQueueUpdated(doctorProfile.userId, {
      appointmentId: updated.id,
      queueNumber: updated.queueNumber,
      status: updated.status,
    })

    const io = getRealtimeServer()
    if (io) {
      const dateStr = appointment.appointmentDate.toISOString().slice(0, 10)
      const snapshot = await getLiveQueueSnapshot(doctorProfile.id, appointment.appointmentDate)
      io.to(`queue:doctor:${doctorProfile.id}:${dateStr}`).emit('queue:snapshot', snapshot)
      io.to(`user:${updated.patient.userId}`).emit('queue:patient-started', {
        appointmentId: updated.id,
        status: updated.status,
      })
    }

    return res.status(200).json({ success: true, message: 'Consultation started', data: serializeQueueAppointment(updated) })
  } catch (error) {
    console.error('Start consultation error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const completeConsultation = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : undefined
    if (!id) {
      return res.status(400).json({ success: false, message: 'Appointment id is required' })
    }

    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.doctorId !== doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot update this appointment' })
    }
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return res.status(409).json({ success: false, message: `Appointment is already ${appointment.status.toLowerCase()}` })
    }

    const now = new Date()
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndTime: now,
        completedAt: now,
      },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })

    await recalculateQueue(doctorProfile.id, appointment.appointmentDate)

    await createNotification({
      recipientId: updated.patient.userId,
      type: 'APPOINTMENT_COMPLETED',
      priority: 'NORMAL',
      title: 'Consultation completed',
      message: `Your consultation with Dr. ${getUserDisplayName(updated.doctor.user)} (Queue #${updated.queueNumber}) has been completed.`,
      entityType: 'appointment',
      entityId: updated.id,
      metadata: { status: updated.status, queueNumber: updated.queueNumber },
    })

    emitQueueUpdated(doctorProfile.userId, {
      appointmentId: updated.id,
      queueNumber: updated.queueNumber,
      status: updated.status,
    })

    const io = getRealtimeServer()
    if (io) {
      const dateStr = appointment.appointmentDate.toISOString().slice(0, 10)
      const snapshot = await getLiveQueueSnapshot(doctorProfile.id, appointment.appointmentDate)
      io.to(`queue:doctor:${doctorProfile.id}:${dateStr}`).emit('queue:snapshot', snapshot)
      io.to(`user:${updated.patient.userId}`).emit('queue:patient-completed', {
        appointmentId: updated.id,
        status: updated.status,
      })
    }

    return res.status(200).json({ success: true, message: 'Consultation completed', data: serializeQueueAppointment(updated) })
  } catch (error) {
    console.error('Complete consultation error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const markNoShow = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : undefined
    if (!id) {
      return res.status(400).json({ success: false, message: 'Appointment id is required' })
    }

    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.doctorId !== doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot update this appointment' })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    })

    await recalculateQueue(doctorProfile.id, appointment.appointmentDate)

    await createNotification({
      recipientId: updated.patient.userId,
      type: 'APPOINTMENT_NO_SHOW',
      priority: 'HIGH',
      title: 'Marked as No-Show',
      message: `You were marked as no-show for Queue #${updated.queueNumber} with Dr. ${getUserDisplayName(updated.doctor.user)}.`,
      entityType: 'appointment',
      entityId: updated.id,
    })

    emitQueueUpdated(doctorProfile.userId, {
      appointmentId: updated.id,
      queueNumber: updated.queueNumber,
      status: updated.status,
    })

    const io = getRealtimeServer()
    if (io) {
      const dateStr = appointment.appointmentDate.toISOString().slice(0, 10)
      const snapshot = await getLiveQueueSnapshot(doctorProfile.id, appointment.appointmentDate)
      io.to(`queue:doctor:${doctorProfile.id}:${dateStr}`).emit('queue:snapshot', snapshot)
      io.to(`user:${updated.patient.userId}`).emit('queue:patient-no-show', {
        appointmentId: updated.id,
        status: updated.status,
      })
    }

    return res.status(200).json({ success: true, message: 'Marked as no-show', data: serializeQueueAppointment(updated) })
  } catch (error) {
    console.error('Mark no show error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
