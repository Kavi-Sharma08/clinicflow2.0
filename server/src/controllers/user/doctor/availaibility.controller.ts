import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const
const VALID_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

type DayOfWeekInput = (typeof VALID_DAYS)[number]

const getDayOfWeek = (date: Date): DayOfWeekInput => DAYS[date.getUTCDay()]

const normalizeDateRange = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

const getDoctorProfile = async (userId: string) =>
  prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true, verificationStatus: true } })

const validateDoctorProfile = async (userId: string) => {
  const doctorProfile = await getDoctorProfile(userId)
  if (!doctorProfile) return { ok: false as const, status: 403, message: 'Doctor profile is required before managing availability' }
  return { ok: true as const, doctorProfile }
}

export const getAvailabilityForDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query
    const doctorUserId = req.user!.id

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'A date query param is required' })
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' })
    }

    const result = await validateDoctorProfile(doctorUserId)
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message })

    const slots = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id, dayOfWeek: getDayOfWeek(parsedDate), isAvailable: true },
      orderBy: { startTime: 'asc' },
    })

    const { start, end } = normalizeDateRange(parsedDate)
    const bookedCount = await prisma.appointment.count({
      where: { doctorId: result.doctorProfile.id, appointmentDate: { gte: start, lt: end }, status: 'BOOKED' },
    })

    const maxAppointments = slots.reduce((sum, slot) => sum + slot.maxAppointments, 0)

    if (slots.length === 0) {
      return res.status(200).json({ success: true, data: { configured: false, date } })
    }

    return res.status(200).json({
      success: true,
      data: {
        configured: true,
        id: slots[0].id,
        date,
        dayOfWeek: getDayOfWeek(parsedDate),
        maxQueueSize: maxAppointments,
        maxAppointments,
        bookedCount,
        slots: slots.map((slot) => ({
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxAppointments: slot.maxAppointments,
          maxQueueSize: slot.maxAppointments,
          isAvailable: slot.isAvailable,
        })),
      },
    })
  } catch (error) {
    console.error('Get availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const createAvailability = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, maxAppointments, maxQueueSize, isAvailable = true } = req.body as {
      dayOfWeek?: DayOfWeekInput
      startTime?: string
      endTime?: string
      maxAppointments?: number
      maxQueueSize?: number
      isAvailable?: boolean
    }
    const doctorUserId = req.user!.id

    if (!dayOfWeek || !VALID_DAYS.includes(dayOfWeek)) {
      return res.status(400).json({ success: false, field: 'dayOfWeek', message: `dayOfWeek must be one of: ${VALID_DAYS.join(', ')}` })
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, field: 'startTime', message: 'Start time and end time are required' })
    }

    const capacity = Number(maxAppointments ?? maxQueueSize)
    if (!Number.isFinite(capacity) || capacity < 1) {
      return res.status(400).json({ success: false, field: 'maxAppointments', message: 'Max appointments must be a positive number' })
    }

    const result = await validateDoctorProfile(doctorUserId)
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message })

    const created = await prisma.doctorAvailability.create({
      data: {
        doctorId: result.doctorProfile.id,
        dayOfWeek,
        startTime,
        endTime,
        maxAppointments: capacity,
        isAvailable,
      },
    })

    return res.status(201).json({ success: true, message: 'Availability created', data: created })
  } catch (error) {
    console.error('Create availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { dayOfWeek, startTime, endTime, maxAppointments, maxQueueSize, isAvailable } = req.body as {
      dayOfWeek?: DayOfWeekInput
      startTime?: string
      endTime?: string
      maxAppointments?: number
      maxQueueSize?: number
      isAvailable?: boolean
    }
    const doctorUserId = req.user!.id

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid availability id' })
    }

    const result = await validateDoctorProfile(doctorUserId)
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message })

    const availability = await prisma.doctorAvailability.findUnique({ where: { id } })

    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability not found' })
    }

    if (availability.doctorId !== result.doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot edit this availability' })
    }

    const capacity = maxAppointments ?? maxQueueSize
    const updated = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        ...(dayOfWeek ? { dayOfWeek } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(typeof capacity === 'number' ? { maxAppointments: capacity } : {}),
        ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
      },
    })

    return res.status(200).json({ success: true, message: 'Availability updated', data: updated })
  } catch (error) {
    console.error('Update availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getAvailabilityForMonth = async (req: Request, res: Response) => {
  try {
    const result = await validateDoctorProfile(req.user!.id)
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message })

    const { month } = req.query as { month?: string }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month query param must be YYYY-MM.' })
    }

    const rows = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    const data = rows.map((row) => ({
      id: row.id,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      maxAppointments: row.maxAppointments,
      maxQueueSize: row.maxAppointments,
      bookedCount: 0,
      isAvailable: row.isAvailable,
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get availability for month error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getAvailabilityList = async (req: Request, res: Response) => {
  try {
    const result = await validateDoctorProfile(req.user!.id)
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message })

    const rows = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    const data = rows.map((row) => ({
      id: row.id,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      maxAppointments: row.maxAppointments,
      maxQueueSize: row.maxAppointments,
      bookedCount: 0,
      isAvailable: row.isAvailable,
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get availability list error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const deleteAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const doctorUserId = req.user!.id

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid availability id' })
    }

    const result = await validateDoctorProfile(doctorUserId)
    if (!result.ok) return res.status(result.status).json({ success: false, message: result.message })

    const availability = await prisma.doctorAvailability.findUnique({ where: { id } })

    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability not found' })
    }

    if (availability.doctorId !== result.doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete this availability' })
    }

    await prisma.doctorAvailability.delete({ where: { id } })
    return res.status(200).json({ success: true, message: 'Availability deleted' })
  } catch (error) {
    console.error('Delete availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
