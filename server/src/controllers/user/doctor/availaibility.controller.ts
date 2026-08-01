import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'

// ── Constants ──────────────────────────────────────────────────────────────
// Single source of truth for valid day-of-week values (matches Prisma enum).
const DAY_OF_WEEK_VALUES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

// Used by getAvailabilityForDate to map Date.getUTCDay() → DayOfWeek string.
// getUTCDay() returns 0=Sunday, 1=Monday, … 6=Saturday.
const UTC_DAY_INDEX: readonly DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number]

// ── Helpers ────────────────────────────────────────────────────────────────
const isValidDay = (value: unknown): value is DayOfWeek =>
  typeof value === 'string' && (DAY_OF_WEEK_VALUES as readonly string[]).includes(value)

const getDayOfWeek = (date: Date): DayOfWeek => UTC_DAY_INDEX[date.getUTCDay()]!

const normalizeDateRange = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

const getDoctorProfile = async (userId: string) =>
  prisma.doctorProfile.findUnique({
    where: { userId },
    select: { id: true, verificationStatus: true },
  })

const validateDoctorProfile = async (userId: string) => {
  const doctorProfile = await getDoctorProfile(userId)
  if (!doctorProfile) {
    return {
      ok: false as const,
      status: 403,
      message: 'Doctor profile is required before managing availability',
    }
  }
  return { ok: true as const, doctorProfile }
}

// Shared row mapper — single source of truth for the API response shape.
const mapAvailabilityRow = (row: {
  id: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  maxAppointments: number
  isAvailable: boolean
}) => ({
  id: row.id,
  dayOfWeek: row.dayOfWeek,
  startTime: row.startTime,
  endTime: row.endTime,
  maxAppointments: row.maxAppointments,
  isAvailable: row.isAvailable,
})

/**
 * Checks whether [newStart, newEnd) overlaps with [existingStart, existingEnd).
 * Adjacent slots (e.g. 09:00–11:00 and 11:00–13:00) are explicitly allowed.
 */
const timesOverlap = (
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string,
): boolean => newStart < existingEnd && newEnd > existingStart

// ── Controllers ────────────────────────────────────────────────────────────
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
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    const dayOfWeek = getDayOfWeek(parsedDate)
    const slots = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id, dayOfWeek, isAvailable: true },
      orderBy: { startTime: 'asc' },
    })

    const { start, end } = normalizeDateRange(parsedDate)
    const bookedCount = await prisma.appointment.count({
      where: {
        doctorId: result.doctorProfile.id,
        appointmentDate: { gte: start, lt: end },
        status: 'BOOKED',
      },
    })

    const maxAppointments = slots.reduce((sum, slot) => sum + slot.maxAppointments, 0)

    if (slots.length === 0) {
      return res.status(200).json({ success: true, data: { configured: false, date } })
    }

    return res.status(200).json({
      success: true,
      data: {
        configured: true,
        id: slots[0]!.id,
        date,
        dayOfWeek,
        maxAppointments,
        bookedCount,
        slots: slots.map(mapAvailabilityRow),
      },
    })
  } catch (error) {
    console.error('Get availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const createAvailability = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, maxAppointments, isAvailable = true } = req.body as {
      dayOfWeek?: unknown
      startTime?: string
      endTime?: string
      maxAppointments?: number
      isAvailable?: boolean
    }

    const doctorUserId = req.user!.id

    // Validate day — isValidDay narrows the type correctly.
    if (!isValidDay(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        field: 'dayOfWeek',
        message: 'Please select a valid day of the week.',
      })
    }

    // Validate times presence
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        field: 'startTime',
        message: 'Both start time and end time are required.',
      })
    }

    // Start must be strictly before end
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        field: 'startTime',
        message: 'Start time must be earlier than end time.',
      })
    }

    const capacity = Number(maxAppointments)
    if (!Number.isFinite(capacity) || capacity < 1) {
      return res.status(400).json({
        success: false,
        field: 'maxAppointments',
        message: 'Maximum appointments must be at least 1.',
      })
    }

    const result = await validateDoctorProfile(doctorUserId)
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    // Overlap check against all existing slots on this day
    const existingSlots = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id, dayOfWeek },
      orderBy: { startTime: 'asc' },
    })

    for (const slot of existingSlots) {
      if (timesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(409).json({
          success: false,
          message: `This time slot overlaps with an existing ${dayOfWeek} slot (${slot.startTime}–${slot.endTime}). Slots on the same day must not overlap.`,
        })
      }
    }

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

    return res.status(201).json({
      success: true,
      message: 'Availability slot created.',
      data: mapAvailabilityRow(created),
    })
  } catch (error) {
    console.error('Create availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { dayOfWeek, startTime, endTime, maxAppointments, isAvailable } = req.body as {
      dayOfWeek?: unknown
      startTime?: string
      endTime?: string
      maxAppointments?: number
      isAvailable?: boolean
    }
    const doctorUserId = req.user!.id

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid availability id' })
    }

    // Validate day if provided
    if (dayOfWeek !== undefined && !isValidDay(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        field: 'dayOfWeek',
        message: 'Please select a valid day of the week.',
      })
    }

    const result = await validateDoctorProfile(doctorUserId)
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    const availability = await prisma.doctorAvailability.findUnique({ where: { id } })

    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability slot not found' })
    }

    if (availability.doctorId !== result.doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot edit this availability slot' })
    }

    // Resolve the effective values after the update (fall back to existing values)
    const effectiveDay = isValidDay(dayOfWeek) ? dayOfWeek : availability.dayOfWeek
    const effectiveStart = startTime ?? availability.startTime
    const effectiveEnd = endTime ?? availability.endTime

    // Validate time ordering
    if (effectiveStart >= effectiveEnd) {
      return res.status(400).json({
        success: false,
        field: 'startTime',
        message: 'Start time must be earlier than end time.',
      })
    }

    // Overlap check — exclude the slot being edited (id !== id)
    const existingSlots = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: result.doctorProfile.id,
        dayOfWeek: effectiveDay,
        NOT: { id },
      },
      orderBy: { startTime: 'asc' },
    })

    for (const slot of existingSlots) {
      if (timesOverlap(effectiveStart, effectiveEnd, slot.startTime, slot.endTime)) {
        return res.status(409).json({
          success: false,
          message: `This time slot overlaps with an existing ${effectiveDay} slot (${slot.startTime}–${slot.endTime}). Slots on the same day must not overlap.`,
        })
      }
    }

    const updated = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        ...(isValidDay(dayOfWeek) ? { dayOfWeek } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        ...(typeof maxAppointments === 'number' ? { maxAppointments } : {}),
        ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Availability slot updated.',
      data: mapAvailabilityRow(updated),
    })
  } catch (error) {
    console.error('Update availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getAvailabilityForMonth = async (req: Request, res: Response) => {
  try {
    const result = await validateDoctorProfile(req.user!.id)
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    const { month } = req.query as { month?: string }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month query param must be YYYY-MM.' })
    }

    const rows = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return res.status(200).json({ success: true, data: rows.map(mapAvailabilityRow) })
  } catch (error) {
    console.error('Get availability for month error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getAvailabilityList = async (req: Request, res: Response) => {
  try {
    const result = await validateDoctorProfile(req.user!.id)
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    const rows = await prisma.doctorAvailability.findMany({
      where: { doctorId: result.doctorProfile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return res.status(200).json({ success: true, data: rows.map(mapAvailabilityRow) })
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
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    const availability = await prisma.doctorAvailability.findUnique({ where: { id } })

    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability slot not found' })
    }

    if (availability.doctorId !== result.doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete this availability slot' })
    }

    await prisma.doctorAvailability.delete({ where: { id } })
    return res.status(200).json({ success: true, message: 'Availability slot deleted.' })
  } catch (error) {
    console.error('Delete availability error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
