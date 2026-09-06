import { type Request, type Response } from 'express'
import { prisma } from '../../../../db/db.js'
import type { AppointmentStatus, RescheduleRequestStatus } from '../../../../generated/prisma/enums.js'
import { getUserDisplayName } from '../../../../utils/userDisplay.js'
import { createNotification, notifyRole } from '../../../../services/notification.service.js'
import { emitQueueUpdated, emitToRole, emitToUser, getRealtimeServer } from '../../../../services/realtime.service.js'
import {
  getLiveQueueSnapshot,
  normalizeDateRange,
  recalculateQueue,
} from '../../../../services/queue.service.js'
import { logAppointmentAudit } from '../../../../services/appointmentAudit.service.js'

const UTC_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const

const getDayOfWeek = (date: Date) => UTC_DAYS[date.getUTCDay()]!

const parseTimeStringToMinutes = (timeStr: string): number => {
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const formatMinutesToTimeString = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const formatMinutesTo12Hour = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

const combineDateAndSlotMinutes = (baseDate: Date, totalMinutes: number): Date => {
  const date = new Date(baseDate)
  date.setUTCHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
  return date
}

export const serializeAdminAppointment = (appointment: any) => ({
  id: appointment.id,
  queueNumber: appointment.queueNumber,
  status: appointment.status,
  urgency: appointment.urgency,
  notes: appointment.notes,
  cancellationReason: appointment.cancellationReason ?? null,
  appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString() : null,
  appointmentTime: appointment.appointmentTime ? new Date(appointment.appointmentTime).toISOString() : null,
  scheduledTime: appointment.scheduledTime ? new Date(appointment.scheduledTime).toISOString() : null,
  estimatedTime: appointment.estimatedTime ? new Date(appointment.estimatedTime).toISOString() : null,
  actualStartTime: appointment.actualStartTime ? new Date(appointment.actualStartTime).toISOString() : null,
  actualEndTime: appointment.actualEndTime ? new Date(appointment.actualEndTime).toISOString() : null,
  consultationFee: Number(appointment.consultationFee),
  createdAt: appointment.createdAt ? new Date(appointment.createdAt).toISOString() : null,
  completedAt: appointment.completedAt ? new Date(appointment.completedAt).toISOString() : null,
  cancelledAt: appointment.cancelledAt ? new Date(appointment.cancelledAt).toISOString() : null,
  rescheduledToId: appointment.rescheduledToId ?? null,
  patient: appointment.patient ? {
    id: appointment.patient.id,
    patientId: appointment.patient.patientId,
    fullName: getUserDisplayName(appointment.patient.user),
    email: appointment.patient.user?.email ?? '',
    phone: appointment.patient.user?.phone ?? '',
    profileImage: appointment.patient.user?.profileImage ?? null,
    gender: appointment.patient.user?.gender ?? null,
    bloodGroup: appointment.patient.user?.bloodGroup ?? null,
    dateOfBirth: appointment.patient.user?.dateOfBirth ? new Date(appointment.patient.user.dateOfBirth).toISOString() : null,
    emergencyContactName: appointment.patient.emergencyContactName ?? null,
    emergencyContactPhone: appointment.patient.emergencyContactPhone ?? null,
    emergencyRelationship: appointment.patient.emergencyRelationship ?? null,
  } : null,
  doctor: appointment.doctor ? {
    id: appointment.doctor.id,
    userId: appointment.doctor.userId,
    fullName: getUserDisplayName(appointment.doctor.user),
    email: appointment.doctor.user?.email ?? '',
    phone: appointment.doctor.user?.phone ?? '',
    department: appointment.doctor.department,
    designation: appointment.doctor.designation ?? null,
    specializations: appointment.doctor.specializations ?? [],
    consultationFee: Number(appointment.doctor.consultationFee),
    profileImage: appointment.doctor.user?.profileImage ?? null,
  } : null,
  rescheduleRequest: appointment.rescheduleRequest ? {
    id: appointment.rescheduleRequest.id,
    status: appointment.rescheduleRequest.status,
    reason: appointment.rescheduleRequest.reason ?? null,
    requestedDate: appointment.rescheduleRequest.requestedDate ? new Date(appointment.rescheduleRequest.requestedDate).toISOString() : null,
    rejectionReason: appointment.rescheduleRequest.rejectionReason ?? null,
    reviewedAt: appointment.rescheduleRequest.reviewedAt ? new Date(appointment.rescheduleRequest.reviewedAt).toISOString() : null,
    reviewedBy: appointment.rescheduleRequest.reviewedBy ? {
      id: appointment.rescheduleRequest.reviewedBy.id,
      name: getUserDisplayName(appointment.rescheduleRequest.reviewedBy),
    } : null,
    createdAt: appointment.rescheduleRequest.createdAt ? new Date(appointment.rescheduleRequest.createdAt).toISOString() : null,
  } : null,
  rescheduledTo: appointment.rescheduledTo ? {
    id: appointment.rescheduledTo.id,
    queueNumber: appointment.rescheduledTo.queueNumber,
    status: appointment.rescheduledTo.status,
    appointmentDate: appointment.rescheduledTo.appointmentDate ? new Date(appointment.rescheduledTo.appointmentDate).toISOString() : null,
    scheduledTime: appointment.rescheduledTo.scheduledTime ? new Date(appointment.rescheduledTo.scheduledTime).toISOString() : null,
  } : null,
  rescheduledFrom: appointment.rescheduledFrom?.[0] ? {
    id: appointment.rescheduledFrom[0].id,
    queueNumber: appointment.rescheduledFrom[0].queueNumber,
    status: appointment.rescheduledFrom[0].status,
    appointmentDate: appointment.rescheduledFrom[0].appointmentDate ? new Date(appointment.rescheduledFrom[0].appointmentDate).toISOString() : null,
    scheduledTime: appointment.rescheduledFrom[0].scheduledTime ? new Date(appointment.rescheduledFrom[0].scheduledTime).toISOString() : null,
  } : null,
  audits: appointment.audits?.map((audit: any) => ({
    id: audit.id,
    action: audit.action,
    previousStatus: audit.previousStatus,
    newStatus: audit.newStatus,
    reason: audit.reason,
    notes: audit.notes,
    performedBy: audit.performedBy ? {
      id: audit.performedBy.id,
      name: getUserDisplayName(audit.performedBy),
      role: audit.performedBy.role,
    } : null,
    createdAt: audit.createdAt ? new Date(audit.createdAt).toISOString() : null,
  })) ?? [],
})

export const listAdminAppointments = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '15',
      search,
      status,
      doctorId,
      department,
      date,
      startDate,
      endDate,
      rescheduleStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 15))
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (typeof status === 'string' && status !== 'ALL') {
      where.status = status as AppointmentStatus
    }

    if (typeof doctorId === 'string' && doctorId.trim()) {
      where.doctorId = doctorId.trim()
    }

    if (typeof department === 'string' && department.trim()) {
      where.doctor = { ...where.doctor, department: { equals: department.trim(), mode: 'insensitive' } }
    }

    if (typeof date === 'string' && date.trim()) {
      const parsedDate = new Date(date)
      if (!Number.isNaN(parsedDate.getTime())) {
        const { start, end } = normalizeDateRange(parsedDate)
        where.appointmentDate = { gte: start, lt: end }
      }
    } else if (typeof startDate === 'string' || typeof endDate === 'string') {
      where.appointmentDate = {}
      if (typeof startDate === 'string' && startDate.trim()) {
        const parsedStart = new Date(startDate)
        if (!Number.isNaN(parsedStart.getTime())) {
          where.appointmentDate.gte = normalizeDateRange(parsedStart).start
        }
      }
      if (typeof endDate === 'string' && endDate.trim()) {
        const parsedEnd = new Date(endDate)
        if (!Number.isNaN(parsedEnd.getTime())) {
          where.appointmentDate.lt = normalizeDateRange(parsedEnd).end
        }
      }
    }

    if (typeof rescheduleStatus === 'string') {
      if (rescheduleStatus === 'HAS_REQUEST') {
        where.rescheduleRequest = { isNot: null }
      } else if (rescheduleStatus !== 'ALL') {
        where.rescheduleRequest = { status: rescheduleStatus as RescheduleRequestStatus }
      }
    }

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim()
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { patient: { patientId: { contains: q, mode: 'insensitive' } } },
        { patient: { user: { firstName: { contains: q, mode: 'insensitive' } } } },
        { patient: { user: { lastName: { contains: q, mode: 'insensitive' } } } },
        { patient: { user: { email: { contains: q, mode: 'insensitive' } } } },
        { patient: { user: { phone: { contains: q, mode: 'insensitive' } } } },
        { doctor: { user: { firstName: { contains: q, mode: 'insensitive' } } } },
        { doctor: { user: { lastName: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    const orderBy: any = []
    if (sortBy === 'appointmentDate') {
      orderBy.push({ appointmentDate: sortOrder === 'asc' ? 'asc' : 'desc' })
      orderBy.push({ queueNumber: 'asc' })
    } else if (sortBy === 'queueNumber') {
      orderBy.push({ queueNumber: sortOrder === 'asc' ? 'asc' : 'desc' })
    } else {
      orderBy.push({ createdAt: sortOrder === 'asc' ? 'asc' : 'desc' })
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
          rescheduleRequest: { include: { reviewedBy: true } },
          rescheduledTo: true,
          rescheduledFrom: true,
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ])

    return res.status(200).json({
      success: true,
      data: appointments.map(serializeAdminAppointment),
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('List admin appointments error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getAdminAppointmentStats = async (_req: Request, res: Response) => {
  try {
    const today = new Date()
    const { start, end } = normalizeDateRange(today)

    const [
      totalToday,
      waitingToday,
      inConsultationToday,
      completedToday,
      noShowToday,
      cancelledToday,
      pendingReschedules,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { appointmentDate: { gte: start, lt: end } },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: start, lt: end },
          status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING'] },
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: start, lt: end },
          status: 'IN_CONSULTATION',
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: start, lt: end },
          status: 'COMPLETED',
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: start, lt: end },
          status: 'NO_SHOW',
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: start, lt: end },
          status: 'CANCELLED',
        },
      }),
      prisma.rescheduleRequest.count({
        where: { status: 'PENDING' },
      }),
    ])

    return res.status(200).json({
      success: true,
      data: {
        todayAppointments: totalToday,
        waiting: waitingToday,
        inConsultation: inConsultationToday,
        completed: completedToday,
        noShows: noShowToday,
        cancelled: cancelledToday,
        pendingReschedules,
      },
    })
  } catch (error) {
    console.error('Get admin appointment stats error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getAdminAppointmentDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Appointment id is required' })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: true,
            availability: { where: { isAvailable: true } },
          },
        },
        patient: { include: { user: true } },
        rescheduleRequest: { include: { reviewedBy: true } },
        rescheduledTo: true,
        rescheduledFrom: true,
        audits: {
          include: { performedBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    return res.status(200).json({
      success: true,
      data: serializeAdminAppointment(appointment),
    })
  } catch (error) {
    console.error('Get admin appointment detail error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ['CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['WAITING', 'IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  WAITING: ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULTATION: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: ['RESCHEDULED'],
  RESCHEDULED: [],
}

export const updateAdminAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, notes, cancellationReason } = req.body as {
      status?: AppointmentStatus
      notes?: string
      cancellationReason?: string
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Appointment id is required' })
    }

    if (!status || !Object.keys(VALID_TRANSITIONS).includes(status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TRANSITION',
        message: 'Invalid appointment status provided.',
      })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    })

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    if (appointment.status === status) {
      return res.status(200).json({
        success: true,
        message: `Appointment is already ${status}`,
        data: serializeAdminAppointment(appointment),
      })
    }

    const allowed = VALID_TRANSITIONS[appointment.status] ?? []
    if (!allowed.includes(status)) {
      return res.status(409).json({
        success: false,
        code: 'INVALID_TRANSITION',
        message: `Status transition from ${appointment.status} to ${status} is not allowed.`,
      })
    }

    const previousStatus = appointment.status
    const now = new Date()

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.appointment.update({
        where: { id },
        data: {
          status,
          ...(status === 'COMPLETED' ? { completedAt: now, actualEndTime: now } : {}),
          ...(status === 'CANCELLED' ? { cancelledAt: now, cancellationReason: cancellationReason?.trim() || 'Cancelled by administrator' } : {}),
          ...(status === 'IN_CONSULTATION' && !appointment.actualStartTime ? { actualStartTime: now } : {}),
          ...(typeof notes === 'string' && notes.trim() ? { notes: notes.trim() } : {}),
        },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
          rescheduleRequest: true,
          rescheduledTo: true,
          rescheduledFrom: true,
        },
      })

      await logAppointmentAudit({
        appointmentId: app.id,
        action: 'STATUS_UPDATE',
        previousStatus,
        newStatus: status,
        performedById: req.user!.id,
        reason: cancellationReason?.trim() || notes?.trim() || 'Status updated by administrator',
      }, tx)

      return app
    })

    // Queue recalculation if queue-impacting status
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'IN_CONSULTATION', 'WAITING'].includes(status)) {
      await recalculateQueue(updated.doctorId, updated.appointmentDate)
    }

    // Patient notification
    let notifTitle = 'Appointment update'
    let notifMsg = `Your appointment status was updated to ${status.replace('_', ' ')}.`
    if (status === 'COMPLETED') {
      notifTitle = 'Consultation completed'
      notifMsg = `Your consultation with Dr. ${getUserDisplayName(updated.doctor.user)} has been completed.`
    } else if (status === 'CANCELLED') {
      notifTitle = 'Appointment cancelled'
      notifMsg = `Your appointment with Dr. ${getUserDisplayName(updated.doctor.user)} was cancelled by the clinic.`
    }

    await createNotification({
      recipientId: updated.patient.userId,
      type: status === 'COMPLETED' ? 'APPOINTMENT_COMPLETED' : status === 'CANCELLED' ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_BOOKED',
      priority: status === 'CANCELLED' ? 'HIGH' : 'NORMAL',
      title: notifTitle,
      message: notifMsg,
      entityType: 'appointment',
      entityId: updated.id,
      metadata: { status: updated.status, queueNumber: updated.queueNumber },
    })

    emitToRole('ADMIN', 'appointment:updated', {
      appointmentId: updated.id,
      previousStatus,
      newStatus: status,
    })

    emitQueueUpdated(updated.doctor.userId, {
      appointmentId: updated.id,
      queueNumber: updated.queueNumber,
      status: updated.status,
    })

    const io = getRealtimeServer()
    if (io) {
      const dateStr = updated.appointmentDate.toISOString().slice(0, 10)
      const snapshot = await getLiveQueueSnapshot(updated.doctorId, updated.appointmentDate)
      io.to(`queue:doctor:${updated.doctorId}:${dateStr}`).emit('queue:snapshot', snapshot)
      io.to(`user:${updated.patient.userId}`).emit('queue:updated', {
        appointmentId: updated.id,
        status: updated.status,
      })
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: serializeAdminAppointment(updated),
    })
  } catch (error) {
    console.error('Update admin appointment status error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const listRescheduleRequests = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '15', status = 'ALL', search } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 15))
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    if (status !== 'ALL') {
      where.status = status as RescheduleRequestStatus
    }

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim()
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { appointmentId: { contains: q, mode: 'insensitive' } },
        { patient: { user: { firstName: { contains: q, mode: 'insensitive' } } } },
        { patient: { user: { lastName: { contains: q, mode: 'insensitive' } } } },
        { doctor: { user: { firstName: { contains: q, mode: 'insensitive' } } } },
        { doctor: { user: { lastName: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    const [total, requests] = await Promise.all([
      prisma.rescheduleRequest.count({ where }),
      prisma.rescheduleRequest.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          reviewedBy: true,
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
    ])

    return res.status(200).json({
      success: true,
      data: requests.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        patientId: item.patientId,
        doctorId: item.doctorId,
        reason: item.reason ?? null,
        requestedDate: item.requestedDate ? item.requestedDate.toISOString() : null,
        status: item.status,
        rejectionReason: item.rejectionReason ?? null,
        createdAt: item.createdAt.toISOString(),
        reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
        reviewedBy: item.reviewedBy ? getUserDisplayName(item.reviewedBy) : null,
        patient: {
          id: item.patient.id,
          patientId: item.patient.patientId,
          fullName: getUserDisplayName(item.patient.user),
          email: item.patient.user.email,
          phone: item.patient.user.phone,
        },
        doctor: {
          id: item.doctor.id,
          fullName: getUserDisplayName(item.doctor.user),
          department: item.doctor.department,
          consultationFee: Number(item.doctor.consultationFee),
        },
        originalAppointment: {
          id: item.appointment.id,
          appointmentDate: item.appointment.appointmentDate.toISOString(),
          appointmentTime: item.appointment.appointmentTime.toISOString(),
          scheduledTime: item.appointment.scheduledTime?.toISOString() ?? item.appointment.appointmentTime.toISOString(),
          queueNumber: item.appointment.queueNumber,
          status: item.appointment.status,
        },
      })),
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('List reschedule requests error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getDoctorAvailableSlotsForReschedule = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params
    const { date } = req.query

    if (!doctorId || typeof doctorId !== 'string') {
      return res.status(400).json({ success: false, message: 'Doctor id is required' })
    }
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required' })
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' })
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: true,
        availability: { where: { isAvailable: true } },
      },
    })

    if (!doctorProfile || doctorProfile.user.accountStatus !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        code: 'DOCTOR_UNAVAILABLE',
        message: 'Doctor profile is inactive or cannot be found.',
      })
    }

    const { start, end } = normalizeDateRange(parsedDate)
    const dayOfWeek = getDayOfWeek(parsedDate)

    const matchingAvailabilities = doctorProfile.availability.filter(
      (a) => a.dayOfWeek === dayOfWeek && a.isAvailable,
    )

    if (matchingAvailabilities.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          doctorName: getUserDisplayName(doctorProfile.user),
          department: doctorProfile.department,
          date: start.toISOString().slice(0, 10),
          dayOfWeek,
          isDoctorWorking: false,
          message: `Dr. ${getUserDisplayName(doctorProfile.user)} does not have scheduled availability on ${dayOfWeek.toLowerCase()}s.`,
          slots: [],
        },
      })
    }

    // Fetch existing occupied appointments for that doctor on that date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] },
      },
      select: {
        id: true,
        scheduledTime: true,
        appointmentTime: true,
        queueNumber: true,
      },
    })

    const occupiedMinutesSet = new Set<number>()
    for (const app of bookedAppointments) {
      const timeToUse = app.scheduledTime ?? app.appointmentTime
      if (timeToUse) {
        const mins = timeToUse.getUTCHours() * 60 + timeToUse.getUTCMinutes()
        occupiedMinutesSet.add(mins)
      }
    }

    const generatedSlots: {
      time: string
      displayTime: string
      isAvailable: boolean
      scheduledTimeIso: string
    }[] = []

    for (const avail of matchingAvailabilities) {
      const duration = avail.consultationDuration || 15
      const startMins = parseTimeStringToMinutes(avail.startTime)
      const endMins = parseTimeStringToMinutes(avail.endTime)

      for (let currentMins = startMins; currentMins + duration <= endMins; currentMins += duration) {
        const slotTimeStr = formatMinutesToTimeString(currentMins)
        const displayTime = formatMinutesTo12Hour(currentMins)
        const isOccupied = occupiedMinutesSet.has(currentMins)
        const scheduledTime = combineDateAndSlotMinutes(start, currentMins)

        generatedSlots.push({
          time: slotTimeStr,
          displayTime,
          isAvailable: !isOccupied,
          scheduledTimeIso: scheduledTime.toISOString(),
        })
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        doctorName: getUserDisplayName(doctorProfile.user),
        department: doctorProfile.department,
        date: start.toISOString().slice(0, 10),
        dayOfWeek,
        isDoctorWorking: true,
        availableSlotsCount: generatedSlots.filter((s) => s.isAvailable).length,
        totalSlotsCount: generatedSlots.length,
        slots: generatedSlots,
      },
    })
  } catch (error) {
    console.error('Get doctor available slots error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const confirmReschedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { newDate, newTime, notes } = req.body as {
      newDate?: string
      newTime?: string
      notes?: string
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Reschedule request id is required' })
    }
    if (!newDate || typeof newDate !== 'string') {
      return res.status(400).json({ success: false, message: 'New appointment date (YYYY-MM-DD) is required' })
    }
    if (!newTime || typeof newTime !== 'string') {
      return res.status(400).json({ success: false, message: 'New appointment time (HH:mm) is required' })
    }

    const parsedDate = new Date(newDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid new date format' })
    }

    const [reqHours = 0, reqMins = 0] = newTime.split(':').map(Number)
    const slotMinutes = reqHours * 60 + reqMins

    const { start: targetStart, end: targetEnd } = normalizeDateRange(parsedDate)
    const targetScheduledTime = combineDateAndSlotMinutes(targetStart, slotMinutes)
    const dayOfWeek = getDayOfWeek(parsedDate)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate reschedule request
      const request = await tx.rescheduleRequest.findUnique({
        where: { id },
        include: {
          appointment: true,
          doctor: {
            include: {
              user: true,
              availability: { where: { isAvailable: true } },
            },
          },
          patient: { include: { user: true } },
        },
      })

      if (!request) {
        throw { status: 404, message: 'Reschedule request not found' }
      }

      if (request.status !== 'PENDING') {
        throw {
          status: 409,
          code: 'ALREADY_PROCESSED',
          message: 'Reschedule request has already been processed.',
        }
      }

      if (request.appointment.status !== 'NO_SHOW') {
        throw {
          status: 409,
          code: 'INVALID_TRANSITION',
          message: `Original appointment is in status ${request.appointment.status} and cannot be rescheduled.`,
        }
      }

      // 2. Validate doctor status and availability on selected day
      if (request.doctor.user.accountStatus !== 'ACTIVE') {
        throw {
          status: 409,
          code: 'DOCTOR_UNAVAILABLE',
          message: 'Doctor is not active or unavailable.',
        }
      }

      const matchingAvail = request.doctor.availability.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isAvailable,
      )

      if (!matchingAvail) {
        throw {
          status: 400,
          code: 'DOCTOR_UNAVAILABLE',
          message: `Doctor has no configured availability on ${dayOfWeek.toLowerCase()}s.`,
        }
      }

      const availStart = parseTimeStringToMinutes(matchingAvail.startTime)
      const availEnd = parseTimeStringToMinutes(matchingAvail.endTime)
      const duration = matchingAvail.consultationDuration || 15

      if (slotMinutes < availStart || slotMinutes + duration > availEnd) {
        throw {
          status: 400,
          code: 'DOCTOR_UNAVAILABLE',
          message: 'Selected time is outside the doctor working hours.',
        }
      }

      // 3. CONCURRENCY CONTROL: Check if this slot is already taken
      const existingOccupant = await tx.appointment.findFirst({
        where: {
          doctorId: request.doctorId,
          appointmentDate: { gte: targetStart, lt: targetEnd },
          scheduledTime: targetScheduledTime,
          status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] },
        },
      })

      if (existingOccupant) {
        throw {
          status: 409,
          code: 'SLOT_UNAVAILABLE',
          message: 'This appointment slot is no longer available. Please select another slot.',
        }
      }

      // 4. Calculate next queue number for the target date
      const maxQueueAgg = await tx.appointment.aggregate({
        where: {
          doctorId: request.doctorId,
          appointmentDate: { gte: targetStart, lt: targetEnd },
        },
        _max: { queueNumber: true },
      })
      const nextQueueNumber = (maxQueueAgg._max.queueNumber ?? 0) + 1

      // 5. Create new BOOKED appointment
      const newAppointment = await tx.appointment.create({
        data: {
          doctorId: request.doctorId,
          patientId: request.patientId,
          appointmentDate: targetStart,
          appointmentTime: targetScheduledTime,
          scheduledTime: targetScheduledTime,
          estimatedTime: targetScheduledTime,
          queueNumber: nextQueueNumber,
          status: 'BOOKED',
          urgency: request.appointment.urgency,
          consultationFee: request.appointment.consultationFee,
          notes: notes?.trim() || request.appointment.notes,
        },
      })

      // 6. Update original appointment to RESCHEDULED and link to new appointment
      await tx.appointment.update({
        where: { id: request.appointmentId },
        data: {
          status: 'RESCHEDULED',
          rescheduledToId: newAppointment.id,
        },
      })

      // 7. Update RescheduleRequest to APPROVED
      await tx.rescheduleRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
        },
      })

      // 8. Log audit history on both appointments
      await logAppointmentAudit(
        {
          appointmentId: request.appointmentId,
          action: 'RESCHEDULED',
          previousStatus: 'NO_SHOW',
          newStatus: 'RESCHEDULED',
          performedById: req.user!.id,
          reason: 'Rescheduled by Administrator',
          notes: `Rescheduled to appointment ${newAppointment.id} (Queue #${nextQueueNumber}) on ${newDate} at ${formatMinutesTo12Hour(slotMinutes)}`,
        },
        tx,
      )

      await logAppointmentAudit(
        {
          appointmentId: newAppointment.id,
          action: 'CREATED_FROM_RESCHEDULE',
          previousStatus: null,
          newStatus: 'BOOKED',
          performedById: req.user!.id,
          reason: `Created from rescheduled appointment ${request.appointmentId}`,
          notes: `Rescheduled by Admin (${req.user?.email ?? req.user?.id})`,
        },
        tx,
      )

      return {
        request,
        newAppointment,
        doctorName: getUserDisplayName(request.doctor.user),
        patientName: getUserDisplayName(request.patient.user),
        patientUserId: request.patient.userId,
        doctorUserId: request.doctor.userId,
      }
    })

    // Recalculate queue on new appointment date
    await recalculateQueue(result.request.doctorId, targetStart)

    const formattedTime = formatMinutesTo12Hour(slotMinutes)
    const formattedDate = targetStart.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    // Notify Patient
    await createNotification({
      recipientId: result.patientUserId,
      type: 'APPOINTMENT_RESCHEDULED',
      priority: 'HIGH',
      title: 'Appointment Rescheduled',
      message: `Your appointment with Dr. ${result.doctorName} has been rescheduled to ${formattedDate} at ${formattedTime} (Queue #${result.newAppointment.queueNumber}).`,
      entityType: 'appointment',
      entityId: result.newAppointment.id,
      metadata: {
        newAppointmentId: result.newAppointment.id,
        originalAppointmentId: result.request.appointmentId,
        date: newDate,
        time: formattedTime,
        queueNumber: result.newAppointment.queueNumber,
      },
    })

    // Notify Doctor
    await createNotification({
      recipientId: result.doctorUserId,
      type: 'APPOINTMENT_RESCHEDULED',
      priority: 'NORMAL',
      title: 'Appointment Rescheduled by Admin',
      message: `Patient ${result.patientName} was rescheduled to ${formattedDate} at ${formattedTime} (Queue #${result.newAppointment.queueNumber}).`,
      entityType: 'appointment',
      entityId: result.newAppointment.id,
      metadata: {
        newAppointmentId: result.newAppointment.id,
        originalAppointmentId: result.request.appointmentId,
      },
    })

    // Realtime events
    emitToRole('ADMIN', 'reschedule:approved', {
      requestId: id,
      originalAppointmentId: result.request.appointmentId,
      newAppointmentId: result.newAppointment.id,
    })

    emitToUser(result.patientUserId, 'appointment:rescheduled', {
      originalAppointmentId: result.request.appointmentId,
      newAppointmentId: result.newAppointment.id,
      date: newDate,
      time: formattedTime,
    })

    emitQueueUpdated(result.doctorUserId, {
      appointmentId: result.newAppointment.id,
      queueNumber: result.newAppointment.queueNumber,
      status: result.newAppointment.status,
    })

    return res.status(200).json({
      success: true,
      message: `Appointment successfully rescheduled to ${formattedDate} at ${formattedTime}.`,
      data: {
        originalAppointmentId: result.request.appointmentId,
        newAppointmentId: result.newAppointment.id,
        newQueueNumber: result.newAppointment.queueNumber,
        newDate,
        newTime: formattedTime,
      },
    })
  } catch (error) {
    const typed = error as { status?: number; code?: string; message?: string }
    if (typed.status) {
      return res.status(typed.status).json({
        success: false,
        code: typed.code,
        message: typed.message ?? 'Failed to reschedule appointment.',
      })
    }
    console.error('Confirm reschedule error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const rejectReschedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { rejectionReason } = req.body as { rejectionReason?: string }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Reschedule request id is required' })
    }
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejecting the reschedule request.',
      })
    }

    const request = await prisma.rescheduleRequest.findUnique({
      where: { id },
      include: {
        appointment: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    })

    if (!request) {
      return res.status(404).json({ success: false, message: 'Reschedule request not found' })
    }

    if (request.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_PROCESSED',
        message: 'Reschedule request has already been processed.',
      })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.rescheduleRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
        },
      })

      await logAppointmentAudit(
        {
          appointmentId: request.appointmentId,
          action: 'RESCHEDULE_REJECTED',
          previousStatus: 'NO_SHOW',
          newStatus: 'NO_SHOW',
          performedById: req.user!.id,
          reason: rejectionReason.trim(),
        },
        tx,
      )

      return updatedReq
    })

    // Patient notification
    await createNotification({
      recipientId: request.patient.userId,
      type: 'RESCHEDULE_REJECTED',
      priority: 'HIGH',
      title: 'Reschedule request not approved',
      message: `Your reschedule request for Dr. ${getUserDisplayName(request.doctor.user)} was not approved. Reason: ${rejectionReason.trim()}`,
      entityType: 'appointment',
      entityId: request.appointmentId,
      metadata: { requestId: request.id, rejectionReason: rejectionReason.trim() },
    })

    emitToRole('ADMIN', 'reschedule:rejected', {
      requestId: request.id,
      appointmentId: request.appointmentId,
    })

    emitToUser(request.patient.userId, 'reschedule:rejected', {
      requestId: request.id,
      appointmentId: request.appointmentId,
      rejectionReason: rejectionReason.trim(),
    })

    return res.status(200).json({
      success: true,
      message: 'Reschedule request rejected.',
      data: updated,
    })
  } catch (error) {
    console.error('Reject reschedule error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
