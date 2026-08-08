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

    const { date, filters, page = '1', limit = '10' } = req.query
    const pageNumber = Math.max(Number(page), 1)
    const pageSize = Math.min(Math.max(Number(limit), 1), 50)
    const whereDate = typeof date === 'string' && date ? normalizeDateRange(new Date(date)) : null

    const andConditions: any[] = []
    
    if (whereDate) {
      andConditions.push({ appointmentDate: { gte: whereDate.start, lt: whereDate.end } })
    }

    if (filters && typeof filters === 'string') {
      try {
        const parsedFilters: Array<{ field: string, operator: string, value: string }> = JSON.parse(filters)
        for (const f of parsedFilters) {
          const { field, operator, value } = f
          if (!value) continue

          let opCondition: any = {}
          const isNegativeOp = operator === 'DOES_NOT_CONTAIN' || operator === 'NOT_EQUALS'

          switch (operator) {
            case 'EQUALS': opCondition = { equals: value }; break
            case 'NOT_EQUALS': opCondition = { not: value }; break
            case 'CONTAINS': opCondition = { contains: value, mode: 'insensitive' }; break
            case 'DOES_NOT_CONTAIN': opCondition = { not: { contains: value, mode: 'insensitive' } }; break
            case 'STARTS_WITH': opCondition = { startsWith: value, mode: 'insensitive' }; break
            case 'ENDS_WITH': opCondition = { endsWith: value, mode: 'insensitive' }; break
            case 'GT': opCondition = { gt: value }; break
            case 'LT': opCondition = { lt: value }; break
            default: opCondition = { equals: value }
          }

          if (field === 'queueNumber') {
            const num = parseInt(value, 10)
            if (!Number.isNaN(num)) {
              let numOpCondition = {}
              switch (operator) {
                case 'EQUALS': numOpCondition = { equals: num }; break
                case 'NOT_EQUALS': numOpCondition = { not: num }; break
                case 'GT': numOpCondition = { gt: num }; break
                case 'LT': numOpCondition = { lt: num }; break
                default: numOpCondition = { equals: num }
              }
              andConditions.push({ queueNumber: numOpCondition })
            }
          } else if (field === 'status') {
             andConditions.push({ status: { equals: value } })
          } else if (field === 'phone') {
             andConditions.push({ patient: { user: { phone: opCondition } } })
          } else if (field === 'email') {
             andConditions.push({ patient: { user: { email: opCondition } } })
          } else if (field === 'patientName') {
             if (isNegativeOp) {
               andConditions.push({
                 AND: [
                   { patient: { user: { firstName: opCondition } } },
                   { patient: { user: { lastName: opCondition } } },
                 ]
               })
             } else {
               andConditions.push({
                 OR: [
                   { patient: { user: { firstName: opCondition } } },
                   { patient: { user: { lastName: opCondition } } },
                 ]
               })
             }
          }
        }
      } catch (e) {
        console.error("Failed to parse filters", e)
      }
    }

    const where = {
      doctorId: doctorProfile.id,
      ...(andConditions.length > 0 ? { AND: andConditions } : {})
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

export const getAppointmentFilterOptions = async (req: Request, res: Response) => {
  try {
    const { date, field, q = '' } = req.query
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'A date query parameter is required.' })
    }
    if (!field || typeof field !== 'string') {
      return res.status(400).json({ success: false, message: 'A field query parameter is required.' })
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
    const searchQuery = typeof q === 'string' ? q.trim() : ''

    const where: any = {
      doctorId: doctorProfile.id,
      appointmentDate: { gte: start, lt: end },
    }

    if (searchQuery) {
      if (field === 'patientName') {
        where.OR = [
          { patient: { user: { firstName: { contains: searchQuery, mode: 'insensitive' } } } },
          { patient: { user: { lastName: { contains: searchQuery, mode: 'insensitive' } } } },
        ]
      } else if (field === 'phone') {
        where.patient = { user: { phone: { contains: searchQuery, mode: 'insensitive' } } }
      } else if (field === 'email') {
        where.patient = { user: { email: { contains: searchQuery, mode: 'insensitive' } } }
      } else {
        return res.status(400).json({ success: false, message: 'Unsupported field for autocomplete.' })
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        patient: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      distinct: ['patientId'],
      take: 20,
    })

    const options: Array<{ id: string, label: string }> = []
    
    appointments.forEach((app) => {
      const u = app.patient.user
      let label = ''
      
      if (field === 'patientName') {
        label = `${u.firstName || ''} ${u.lastName || ''}`.trim()
      } else if (field === 'phone') {
        label = u.phone || ''
      } else if (field === 'email') {
        label = u.email || ''
      }
      
      if (label) {
        options.push({ id: label, label })
      }
    })

    return res.status(200).json({
      success: true,
      data: options,
    })
  } catch (error) {
    console.error('Get appointment filter options error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
