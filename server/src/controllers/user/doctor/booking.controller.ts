import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'
import { createNotification } from '../../../services/notification.service.js'
import { emitQueueUpdated } from '../../../services/realtime.service.js'

const VALID_STATUS = ['BOOKED', 'COMPLETED', 'CANCELLED'] as const
type AppointmentStatusInput = (typeof VALID_STATUS)[number]

const normalizeDateRange = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

const getDoctorProfile = async (userId: string) =>
  prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } })

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
  patient: {
    patientId: string
    emergencyContactName?: string | null
    emergencyContactPhone?: string | null
    user: {
      firstName?: string | null
      middleName?: string | null
      lastName?: string | null
      email: string
      phone: string
      gender: string
      bloodGroup?: string | null
      dateOfBirth?: Date | null
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
  patient: {
    id: appointment.patient.patientId,
    fullName: getUserDisplayName(appointment.patient.user),
    email: appointment.patient.user.email,
    phone: appointment.patient.user.phone,
    gender: appointment.patient.user.gender,
    bloodGroup: appointment.patient.user.bloodGroup ?? null,
    dateOfBirth: appointment.patient.user.dateOfBirth?.toISOString() ?? null,
    profileImage: appointment.patient.user.profileImage ?? null,
    emergencyContactName: appointment.patient.emergencyContactName ?? null,
    emergencyContactPhone: appointment.patient.emergencyContactPhone ?? null,
  },
})

export const getBookingsList = async (req: Request, res: Response) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const availabilities = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctorProfile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    const data = await Promise.all(availabilities.map(async (availability) => {
      const totalBooked = await prisma.appointment.count({
        where: { doctorId: doctorProfile.id, status: 'BOOKED' },
      })

      return {
        id: availability.id,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
        totalBooked,
        maxQueueSize: availability.maxAppointments,
        maxAppointments: availability.maxAppointments,
        isAvailable: availability.isAvailable,
      }
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get bookings list error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getBookingsForDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'A date query parameter is required.' })
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date query parameter.' })
    }

    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const { start, end } = normalizeDateRange(parsedDate)
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctorProfile.id, appointmentDate: { gte: start, lt: end } },
      orderBy: { queueNumber: 'asc' },
      include: { patient: { include: { user: true } } },
    })

    return res.status(200).json({ success: true, data: appointments.map(serializeAppointment) })
  } catch (error) {
    console.error('Get bookings for date error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const { status, date, search, page = '1', limit = '10' } = req.query
    const pageNumber = Math.max(Number(page), 1)
    const pageSize = Math.min(Math.max(Number(limit), 1), 50)
    const whereDate = typeof date === 'string' && date ? normalizeDateRange(new Date(date)) : null
    const parsedStatus = typeof status === 'string' && VALID_STATUS.includes(status as AppointmentStatusInput) ? status as AppointmentStatusInput : undefined
    const searchText = typeof search === 'string' && search.trim() ? search.trim() : undefined

    const where = {
      doctorId: doctorProfile.id,
      ...(parsedStatus ? { status: parsedStatus } : {}),
      ...(whereDate ? { appointmentDate: { gte: whereDate.start, lt: whereDate.end } } : {}),
      ...(searchText ? {
        patient: {
          user: {
            OR: [
              { firstName: { contains: searchText, mode: 'insensitive' as const } },
              { lastName: { contains: searchText, mode: 'insensitive' as const } },
              { phone: { contains: searchText, mode: 'insensitive' as const } },
              { email: { contains: searchText, mode: 'insensitive' as const } },
            ],
          },
        },
      } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: [{ appointmentDate: 'asc' }, { queueNumber: 'asc' }],
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: { patient: { include: { user: true } } },
      }),
      prisma.appointment.count({ where }),
    ])

    return res.status(200).json({
      success: true,
      data: items.map(serializeAppointment),
      meta: { page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('Get doctor appointments error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const updateDoctorAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, cancellationReason } = req.body as { status?: AppointmentStatusInput; cancellationReason?: string }

    if (!id) {
      return res.status(400).json({ success: false, message: 'Appointment id is required' })
    }
    if (!status || !VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, field: 'status', message: `status must be one of: ${VALID_STATUS.join(', ')}` })
    }

    const doctorProfile = await getDoctorProfile(req.user!.id)
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' })
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.doctorId !== doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot update this appointment' })
    }
    if (appointment.status !== 'BOOKED') {
      return res.status(409).json({ success: false, message: `Cannot update an appointment that is already ${appointment.status.toLowerCase()}` })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        ...(status === 'CANCELLED' ? { cancelledAt: new Date(), cancellationReason: cancellationReason?.trim() || 'Cancelled by doctor' } : {}),
      },
      include: { patient: { include: { user: true } } },
    })

    await createNotification({
      recipientId: updated.patient.userId,
      type: status === 'COMPLETED' ? 'APPOINTMENT_COMPLETED' : 'APPOINTMENT_CANCELLED',
      priority: status === 'CANCELLED' ? 'HIGH' : 'NORMAL',
      title: status === 'COMPLETED' ? 'Consultation completed' : 'Appointment cancelled by doctor',
      message: status === 'COMPLETED'
        ? `Your consultation for queue #${updated.queueNumber} has been marked completed.`
        : `Your appointment for queue #${updated.queueNumber} was cancelled by the doctor.`,
      entityType: 'appointment',
      entityId: updated.id,
      metadata: { status: updated.status, queueNumber: updated.queueNumber },
    })
    emitQueueUpdated(req.user!.id, { appointmentId: updated.id, queueNumber: updated.queueNumber, status: updated.status })

    return res.status(200).json({ success: true, message: 'Appointment updated', data: serializeAppointment(updated) })
  } catch (error) {
    console.error('Update doctor appointment status error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
