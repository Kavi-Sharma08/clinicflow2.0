import crypto from 'node:crypto'
import { prisma } from '../db/db.js'
import { env } from '../config/env.js'
import {
  combineDateAndTime,
  getLiveQueueSnapshot,
  normalizeDateRange,
  recalculateQueue,
} from './queue.service.js'
import { emitQueueUpdated, getRealtimeServer } from './realtime.service.js'
import { getUserDisplayName } from '../utils/userDisplay.js'
import {
  sendGuestAppointmentConfirmationEmail,
  sendGuestCancellationEmail,
  sendGuestRescheduleEmail,
  sendGuestWalkInConfirmationEmail,
} from './email/index.js'

const UTC_DAY_INDEX = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const

const getDayOfWeek = (date: Date) => {
  return UTC_DAY_INDEX[date.getUTCDay()]!
}

// ── Token & Reference Utilities ──────────────────────────────────────

export const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

export const hashToken = (rawToken: string) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export const generateBookingReference = () => {
  const timestampPart = Date.now().toString(36).toUpperCase()
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `CF-${timestampPart}-${randomPart}`
}

export const generateDoctorSlug = (firstName: string, lastName?: string | null, doctorId?: string) => {
  const cleanName = [firstName, lastName]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = doctorId ? doctorId.slice(-6).toLowerCase() : crypto.randomBytes(3).toString('hex')
  return `dr-${cleanName || 'physician'}-${suffix}`
}

// ── Doctor Lookup ────────────────────────────────────────────────────

export const resolveDoctor = async (identifier: string) => {
  if (!identifier || typeof identifier !== 'string') return null

  // Lookup by slug or by ID
  return prisma.doctorProfile.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
      verificationStatus: 'VERIFIED',
    },
    include: {
      user: true,
      availability: {
        where: { isAvailable: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })
}

// ── Public Doctor Profile ────────────────────────────────────────────

export const getPublicDoctorProfile = async (identifier: string) => {
  const doctor = await resolveDoctor(identifier)
  if (!doctor) return null

  // Check if today has active schedule and if walk-in queue is open
  const today = new Date()
  const todayDay = getDayOfWeek(today)
  const todaySlot = doctor.availability.find((slot) => slot.dayOfWeek === todayDay)

  let walkInAvailable = false
  let todayCapacityRemaining = 0
  let currentWaitingCount = 0

  if (todaySlot) {
    const { start, end } = normalizeDateRange(today)
    const activeCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
      },
    })
    todayCapacityRemaining = Math.max(0, todaySlot.maxAppointments - activeCount)
    walkInAvailable = todayCapacityRemaining > 0
    currentWaitingCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'WAITING'] },
      },
    })
  }

  // Clinic address synthesis from user address fields if present
  const clinicAddressParts = [
    doctor.user.addressLine1,
    doctor.user.addressLine2,
    doctor.user.city,
    doctor.user.state,
    doctor.user.postalCode,
  ].filter(Boolean)

  const clinicAddress = clinicAddressParts.length > 0 ? clinicAddressParts.join(', ') : null

  return {
    doctorId: doctor.id,
    slug: doctor.slug || doctor.id,
    fullName: getUserDisplayName(doctor.user),
    department: doctor.department,
    designation: doctor.designation ?? 'Consulting Physician',
    specializations: doctor.specializations,
    specialization: doctor.specializations[0] ?? doctor.department,
    biography: doctor.biography,
    consultationFee: Number(doctor.consultationFee),
    profileImage: doctor.user.profileImage ?? null,
    clinicAddress,
    hasAvailabilityConfigured: doctor.availability.length > 0,
    scheduleSummary: doctor.availability.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      consultationDuration: s.consultationDuration,
    })),
    walkIn: {
      isAvailableToday: walkInAvailable,
      todayCapacityRemaining,
      currentWaitingCount,
      consultationDuration: todaySlot?.consultationDuration ?? 15,
      estimatedWaitMinutes: currentWaitingCount * (todaySlot?.consultationDuration ?? 15),
    },
  }
}

// ── Public Availability Dates & Slots ────────────────────────────────

export const getPublicDoctorAvailability = async (identifier: string) => {
  const doctor = await resolveDoctor(identifier)
  if (!doctor) return null

  if (doctor.availability.length === 0) {
    return { doctorId: doctor.id, dates: [], slots: [] }
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + index)
    return date
  })

  const results = await Promise.all(
    days.map(async (date) => {
      const dayOfWeek = getDayOfWeek(date)
      const matchingSlots = doctor.availability.filter((slot) => slot.dayOfWeek === dayOfWeek)

      if (matchingSlots.length === 0) return null

      const { start, end } = normalizeDateRange(date)

      const slotsWithCapacity = await Promise.all(
        matchingSlots.map(async (slot) => {
          const bookedCount = await prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              appointmentDate: { gte: start, lt: end },
              status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
            },
          })

          const remainingCapacity = Math.max(0, slot.maxAppointments - bookedCount)
          const isFullyBooked = remainingCapacity <= 0

          return {
            availabilityId: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            consultationDuration: slot.consultationDuration,
            maxAppointments: slot.maxAppointments,
            bookedCount,
            remainingCapacity,
            isFullyBooked,
          }
        }),
      )

      const hasAnyAvailableSlot = slotsWithCapacity.some((s) => !s.isFullyBooked)

      return {
        date: date.toISOString().slice(0, 10),
        dayOfWeek,
        hasAvailableSlots: hasAnyAvailableSlot,
        slots: slotsWithCapacity,
      }
    }),
  )

  const availableDates = results.filter((r): r is NonNullable<typeof r> => r !== null)

  return {
    doctorId: doctor.id,
    doctorSlug: doctor.slug || doctor.id,
    dates: availableDates,
  }
}

// ── Create Scheduled Guest Appointment ───────────────────────────────

export interface CreateGuestBookingInput {
  doctorIdentifier: string
  availabilityId: string
  appointmentDate: string // YYYY-MM-DD
  guestName: string
  guestPhone: string
  guestEmail: string
  notes?: string
}

export const createGuestBooking = async (input: CreateGuestBookingInput) => {
  const { doctorIdentifier, availabilityId, appointmentDate, guestName, guestPhone, guestEmail, notes } = input

  // Normalize phone & email
  const cleanPhone = guestPhone.trim().replace(/\s+/g, '')
  const cleanEmail = guestEmail.trim().toLowerCase()
  const cleanName = guestName.trim()

  const parsedDate = new Date(appointmentDate)
  if (Number.isNaN(parsedDate.getTime())) {
    throw { status: 400, message: 'Invalid appointment date format. Use YYYY-MM-DD.' }
  }

  const { start, end } = normalizeDateRange(parsedDate)
  const rawToken = generateSecureToken()
  const tokenHash = hashToken(rawToken)
  const bookingReference = generateBookingReference()

  // 30 days token expiry
  const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const result = await prisma.$transaction(async (tx) => {
    // 1. Resolve and verify doctor
    const doctor = await tx.doctorProfile.findFirst({
      where: {
        OR: [{ slug: doctorIdentifier }, { id: doctorIdentifier }],
        verificationStatus: 'VERIFIED',
      },
      include: { user: true },
    })

    if (!doctor) {
      throw { status: 404, message: 'Doctor not found or not accepting bookings.' }
    }

    // 2. Validate availability slot
    const availability = await tx.doctorAvailability.findFirst({
      where: {
        id: availabilityId,
        doctorId: doctor.id,
        isAvailable: true,
      },
    })

    if (!availability) {
      throw { status: 404, message: 'Selected availability slot is invalid or no longer offered.' }
    }

    const dayOfWeek = getDayOfWeek(parsedDate)
    if (availability.dayOfWeek !== dayOfWeek) {
      throw { status: 400, message: `The requested date falls on ${dayOfWeek}, which does not match the schedule.` }
    }

    // 3. Duplicate prevention: check if patient with same phone/email already has an active booking on this date
    const existingGuestBooking = await tx.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
        OR: [
          { guestPhone: cleanPhone },
          { guestEmail: cleanEmail },
        ],
      },
    })

    if (existingGuestBooking) {
      throw {
        status: 409,
        message: 'An active appointment with this phone or email already exists with this doctor on this date.',
      }
    }

    // 4. Capacity check
    const activeCount = await tx.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
      },
    })

    if (activeCount >= availability.maxAppointments) {
      throw { status: 409, message: 'This consultation slot has just been filled. Please select another slot or date.' }
    }

    // 5. Compute next queue number
    const lastIssued = await tx.appointment.aggregate({
      where: { doctorId: doctor.id, appointmentDate: { gte: start, lt: end } },
      _max: { queueNumber: true },
    })
    const nextQueueNumber = (lastIssued._max.queueNumber ?? 0) + 1

    const durationMinutes = availability.consultationDuration ?? 15
    const slotStartTime = combineDateAndTime(start, availability.startTime)
    const scheduledTime = new Date(slotStartTime.getTime() + (nextQueueNumber - 1) * durationMinutes * 60 * 1000)

    // 6. Create appointment
    const created = await tx.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: null,
        isGuest: true,
        guestName: cleanName,
        guestPhone: cleanPhone,
        guestEmail: cleanEmail,
        bookingReference,
        isWalkIn: false,
        guestTokenHash: tokenHash,
        guestTokenExpiry: tokenExpiry,
        appointmentDate: start,
        appointmentTime: slotStartTime,
        scheduledTime,
        estimatedTime: scheduledTime,
        queueNumber: nextQueueNumber,
        status: 'BOOKED',
        urgency: 'ROUTINE',
        consultationFee: doctor.consultationFee,
        notes: notes?.trim() || null,
      },
      include: {
        doctor: { include: { user: true } },
      },
    })

    return created
  })

  // 7. Recalculate queue & emit real-time updates
  await recalculateQueue(result.doctorId, result.appointmentDate)
  emitQueueUpdated(result.doctor.userId, {
    appointmentId: result.id,
    queueNumber: result.queueNumber,
    status: result.status,
  })

  const io = getRealtimeServer()
  if (io) {
    const dateStr = result.appointmentDate.toISOString().slice(0, 10)
    const snapshot = await getLiveQueueSnapshot(result.doctorId, result.appointmentDate)
    io.to(`queue:doctor:${result.doctorId}:${dateStr}`).emit('queue:snapshot', snapshot)
  }

  // 8. Send confirmation email safely (non-blocking)
  let emailSent = false
  try {
    const timeFormatted = result.scheduledTime
      ? result.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
      : result.appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })

    const dateFormatted = result.appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })

    const addressParts = [
      result.doctor.user.addressLine1,
      result.doctor.user.city,
      result.doctor.user.state,
    ].filter(Boolean)

    await sendGuestAppointmentConfirmationEmail({
      to: cleanEmail,
      patientName: cleanName,
      doctorName: getUserDisplayName(result.doctor.user),
      department: result.doctor.department,
      clinicAddress: addressParts.length > 0 ? addressParts.join(', ') : null,
      appointmentDate: dateFormatted,
      appointmentTime: timeFormatted,
      bookingReference: result.bookingReference!,
      queueNumber: result.queueNumber,
      managementToken: rawToken,
    })
    emailSent = true
  } catch (err) {
    console.warn(`[GuestBooking] Confirmation email delivery skipped or failed for ${cleanEmail}:`, err instanceof Error ? err.message : err)
  }

  const managementUrl = `${env.CLIENT_URL}/appointments/manage/${rawToken}`

  return {
    appointmentId: result.id,
    bookingReference: result.bookingReference,
    queueNumber: result.queueNumber,
    status: result.status,
    appointmentDate: result.appointmentDate.toISOString(),
    scheduledTime: result.scheduledTime?.toISOString(),
    consultationFee: Number(result.consultationFee),
    doctor: {
      id: result.doctor.id,
      name: `Dr. ${getUserDisplayName(result.doctor.user)}`,
      department: result.doctor.department,
      specialization: result.doctor.specializations[0] ?? result.doctor.department,
    },
    guest: {
      name: result.guestName,
      phone: result.guestPhone,
      email: result.guestEmail,
    },
    managementToken: rawToken,
    managementUrl,
    emailSent,
  }
}

// ── Join Today's Walk-in Queue ───────────────────────────────────────

export interface JoinWalkInQueueInput {
  doctorIdentifier: string
  guestName: string
  guestPhone: string
  guestEmail: string
  notes?: string
}

export const joinWalkInQueue = async (input: JoinWalkInQueueInput) => {
  const { doctorIdentifier, guestName, guestPhone, guestEmail, notes } = input

  const cleanPhone = guestPhone.trim().replace(/\s+/g, '')
  const cleanEmail = guestEmail.trim().toLowerCase()
  const cleanName = guestName.trim()

  const today = new Date()
  const { start, end } = normalizeDateRange(today)
  const todayDay = getDayOfWeek(today)

  const rawToken = generateSecureToken()
  const tokenHash = hashToken(rawToken)
  const bookingReference = generateBookingReference()
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for walk-in

  const result = await prisma.$transaction(async (tx) => {
    // 1. Resolve and verify doctor
    const doctor = await tx.doctorProfile.findFirst({
      where: {
        OR: [{ slug: doctorIdentifier }, { id: doctorIdentifier }],
        verificationStatus: 'VERIFIED',
      },
      include: { user: true },
    })

    if (!doctor) {
      throw { status: 404, message: 'Doctor not found or unavailable.' }
    }

    // 2. Verify doctor has active availability for today
    const availability = await tx.doctorAvailability.findFirst({
      where: {
        doctorId: doctor.id,
        dayOfWeek: todayDay,
        isAvailable: true,
      },
    })

    if (!availability) {
      throw { status: 400, message: `Dr. ${getUserDisplayName(doctor.user)} does not have consultation hours today (${todayDay}).` }
    }

    // 3. Duplicate prevention: check active queue entry today
    const existingEntry = await tx.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
        OR: [
          { guestPhone: cleanPhone },
          { guestEmail: cleanEmail },
        ],
      },
    })

    if (existingEntry) {
      throw {
        status: 409,
        message: `You already have an active queue position (#${existingEntry.queueNumber}) with this doctor today.`,
      }
    }

    // 4. Capacity check
    const activeCount = await tx.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: start, lt: end },
        status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
      },
    })

    if (activeCount >= availability.maxAppointments) {
      throw { status: 409, message: "Today's queue capacity has reached the maximum allowed limit for walk-in patients." }
    }

    // 5. Assign next queue number
    const lastIssued = await tx.appointment.aggregate({
      where: { doctorId: doctor.id, appointmentDate: { gte: start, lt: end } },
      _max: { queueNumber: true },
    })
    const nextQueueNumber = (lastIssued._max.queueNumber ?? 0) + 1

    const slotStartTime = combineDateAndTime(start, availability.startTime)

    // 6. Create walk-in appointment
    const created = await tx.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: null,
        isGuest: true,
        guestName: cleanName,
        guestPhone: cleanPhone,
        guestEmail: cleanEmail,
        bookingReference,
        isWalkIn: true,
        guestTokenHash: tokenHash,
        guestTokenExpiry: tokenExpiry,
        appointmentDate: start,
        appointmentTime: slotStartTime,
        queueNumber: nextQueueNumber,
        status: 'WAITING',
        urgency: 'ROUTINE',
        consultationFee: doctor.consultationFee,
        notes: notes?.trim() || null,
      },
      include: {
        doctor: { include: { user: true } },
      },
    })

    return created
  })

  // 7. Recalculate queue & emit Socket.IO
  await recalculateQueue(result.doctorId, result.appointmentDate)
  emitQueueUpdated(result.doctor.userId, {
    appointmentId: result.id,
    queueNumber: result.queueNumber,
    status: result.status,
  })

  const io = getRealtimeServer()
  if (io) {
    const dateStr = result.appointmentDate.toISOString().slice(0, 10)
    const snapshot = await getLiveQueueSnapshot(result.doctorId, result.appointmentDate)
    io.to(`queue:doctor:${result.doctorId}:${dateStr}`).emit('queue:snapshot', snapshot)
  }

  // 8. Calculate estimated wait time
  const waitingAheadCount = await prisma.appointment.count({
    where: {
      doctorId: result.doctorId,
      appointmentDate: { gte: start, lt: end },
      status: { in: ['BOOKED', 'WAITING'] },
      queueNumber: { lt: result.queueNumber },
    },
  })

  const estimatedMinutes = waitingAheadCount * 15
  const estimatedWaitStr = `${estimatedMinutes} minute${estimatedMinutes === 1 ? '' : 's'}`

  // 9. Send email confirmation safely
  let emailSent = false
  try {
    const dateFormatted = result.appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })

    const addressParts = [
      result.doctor.user.addressLine1,
      result.doctor.user.city,
      result.doctor.user.state,
    ].filter(Boolean)

    await sendGuestWalkInConfirmationEmail({
      to: cleanEmail,
      patientName: cleanName,
      doctorName: getUserDisplayName(result.doctor.user),
      department: result.doctor.department,
      clinicAddress: addressParts.length > 0 ? addressParts.join(', ') : null,
      date: dateFormatted,
      queueNumber: result.queueNumber,
      estimatedTime: estimatedWaitStr,
      bookingReference: result.bookingReference!,
      managementToken: rawToken,
    })
    emailSent = true
  } catch (err) {
    console.warn(`[GuestWalkIn] Confirmation email delivery skipped for ${cleanEmail}:`, err instanceof Error ? err.message : err)
  }

  const managementUrl = `${env.CLIENT_URL}/appointments/manage/${rawToken}`

  return {
    appointmentId: result.id,
    bookingReference: result.bookingReference,
    queueNumber: result.queueNumber,
    status: result.status,
    positionInLine: waitingAheadCount + 1,
    patientsAhead: waitingAheadCount,
    estimatedWaitMinutes: estimatedMinutes,
    appointmentDate: result.appointmentDate.toISOString(),
    doctor: {
      id: result.doctor.id,
      name: `Dr. ${getUserDisplayName(result.doctor.user)}`,
      department: result.doctor.department,
    },
    guest: {
      name: result.guestName,
      phone: result.guestPhone,
      email: result.guestEmail,
    },
    managementToken: rawToken,
    managementUrl,
    emailSent,
  }
}

// ── Secure Token-Based Management ────────────────────────────────────

export const getGuestAppointmentByToken = async (rawToken: string) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw { status: 400, message: 'Invalid or missing management token' }
  }

  const tokenHash = hashToken(rawToken)

  const appointment = await prisma.appointment.findFirst({
    where: { guestTokenHash: tokenHash },
    include: {
      doctor: { include: { user: true, availability: { where: { isAvailable: true } } } },
    },
  })

  if (!appointment) {
    throw { status: 404, message: 'No appointment found with this management link.' }
  }

  // Expiry check
  if (appointment.guestTokenExpiry && appointment.guestTokenExpiry < new Date()) {
    throw { status: 410, message: 'This management link has expired.' }
  }

  // Revocation check
  if (appointment.guestTokenRevokedAt) {
    throw { status: 403, message: 'This management link has been revoked.' }
  }

  const { start, end } = normalizeDateRange(appointment.appointmentDate)

  const waitingAheadCount = await prisma.appointment.count({
    where: {
      doctorId: appointment.doctorId,
      appointmentDate: { gte: start, lt: end },
      status: { in: ['BOOKED', 'WAITING'] },
      queueNumber: { lt: appointment.queueNumber },
    },
  })

  const inConsultation = await prisma.appointment.findFirst({
    where: {
      doctorId: appointment.doctorId,
      appointmentDate: { gte: start, lt: end },
      status: 'IN_CONSULTATION',
    },
    select: { queueNumber: true },
  })

  const canCancel = appointment.status === 'BOOKED' || appointment.status === 'WAITING'
  const canReschedule = (appointment.status === 'BOOKED' || appointment.status === 'WAITING') && !appointment.isWalkIn

  const addressParts = [
    appointment.doctor.user.addressLine1,
    appointment.doctor.user.city,
    appointment.doctor.user.state,
  ].filter(Boolean)

  return {
    appointmentId: appointment.id,
    bookingReference: appointment.bookingReference,
    queueNumber: appointment.queueNumber,
    status: appointment.status,
    isGuest: appointment.isGuest,
    isWalkIn: appointment.isWalkIn,
    notes: appointment.notes,
    cancellationReason: appointment.cancellationReason,
    appointmentDate: appointment.appointmentDate.toISOString(),
    appointmentTime: appointment.appointmentTime.toISOString(),
    scheduledTime: appointment.scheduledTime?.toISOString() ?? appointment.appointmentTime.toISOString(),
    estimatedTime: appointment.estimatedTime?.toISOString() ?? null,
    consultationFee: Number(appointment.consultationFee),
    patientsAhead: waitingAheadCount,
    currentServingQueueNumber: inConsultation?.queueNumber ?? null,
    canCancel,
    canReschedule,
    doctor: {
      id: appointment.doctor.id,
      slug: appointment.doctor.slug || appointment.doctor.id,
      fullName: getUserDisplayName(appointment.doctor.user),
      department: appointment.doctor.department,
      specialization: appointment.doctor.specializations[0] ?? appointment.doctor.department,
      clinicAddress: addressParts.length > 0 ? addressParts.join(', ') : null,
      profileImage: appointment.doctor.user.profileImage ?? null,
    },
    guest: {
      name: appointment.guestName,
      phone: appointment.guestPhone,
      email: appointment.guestEmail,
    },
  }
}

// ── Cancel Guest Appointment ─────────────────────────────────────────

export const cancelGuestAppointment = async (rawToken: string, reason?: string) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw { status: 400, message: 'Invalid management token' }
  }

  const tokenHash = hashToken(rawToken)

  const appointment = await prisma.appointment.findFirst({
    where: { guestTokenHash: tokenHash },
    include: { doctor: { include: { user: true } } },
  })

  if (!appointment) {
    throw { status: 404, message: 'Appointment not found' }
  }

  if (appointment.status === 'CANCELLED') {
    return {
      success: true,
      message: 'Appointment was already cancelled.',
      status: 'CANCELLED',
      appointmentId: appointment.id,
    }
  }

  if (appointment.status === 'COMPLETED' || appointment.status === 'IN_CONSULTATION') {
    throw { status: 409, message: `Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}.` }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason?.trim() || 'Cancelled by patient',
    },
    include: { doctor: { include: { user: true } } },
  })

  // Recalculate queue & emit updates
  await recalculateQueue(updated.doctorId, updated.appointmentDate)
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
  }

  // Send cancellation email safely
  if (updated.guestEmail) {
    try {
      const dateFormatted = updated.appointmentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
      const timeFormatted = updated.scheduledTime
        ? updated.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
        : updated.appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })

      await sendGuestCancellationEmail({
        to: updated.guestEmail,
        patientName: updated.guestName || 'Patient',
        doctorName: getUserDisplayName(updated.doctor.user),
        appointmentDate: dateFormatted,
        appointmentTime: timeFormatted,
        bookingReference: updated.bookingReference || 'N/A',
        reason: updated.cancellationReason,
      })
    } catch (err) {
      console.warn('[GuestCancellation] Email notice failed:', err instanceof Error ? err.message : err)
    }
  }

  return {
    success: true,
    message: 'Appointment successfully cancelled.',
    appointmentId: updated.id,
    status: updated.status,
    cancelledAt: updated.cancelledAt?.toISOString(),
  }
}

// ── Reschedule Guest Appointment ─────────────────────────────────────

export interface RescheduleGuestInput {
  rawToken: string
  newAvailabilityId: string
  newAppointmentDate: string // YYYY-MM-DD
}

export const rescheduleGuestAppointment = async (input: RescheduleGuestInput) => {
  const { rawToken, newAvailabilityId, newAppointmentDate } = input

  if (!rawToken || typeof rawToken !== 'string') {
    throw { status: 400, message: 'Invalid management token' }
  }

  const tokenHash = hashToken(rawToken)
  const parsedNewDate = new Date(newAppointmentDate)
  if (Number.isNaN(parsedNewDate.getTime())) {
    throw { status: 400, message: 'Invalid new appointment date format. Use YYYY-MM-DD.' }
  }

  const { start: newStart, end: newEnd } = normalizeDateRange(parsedNewDate)

  const appointment = await prisma.appointment.findFirst({
    where: { guestTokenHash: tokenHash },
    include: { doctor: { include: { user: true } } },
  })

  if (!appointment) {
    throw { status: 404, message: 'Appointment not found' }
  }

  if (appointment.status !== 'BOOKED' && appointment.status !== 'WAITING') {
    throw { status: 409, message: `Cannot reschedule an appointment that is already ${appointment.status.toLowerCase()}.` }
  }

  if (appointment.isWalkIn) {
    throw { status: 400, message: "Walk-in queue entries cannot be rescheduled to a future date." }
  }

  const oldDate = appointment.appointmentDate
  const oldDoctorId = appointment.doctorId

  const updatedAppointment = await prisma.$transaction(async (tx) => {
    // 1. Verify destination slot
    const availability = await tx.doctorAvailability.findFirst({
      where: {
        id: newAvailabilityId,
        doctorId: appointment.doctorId,
        isAvailable: true,
      },
    })

    if (!availability) {
      throw { status: 404, message: 'Destination slot not found or inactive.' }
    }

    const dayOfWeek = getDayOfWeek(parsedNewDate)
    if (availability.dayOfWeek !== dayOfWeek) {
      throw { status: 400, message: `The new date falls on ${dayOfWeek}, which does not match the slot schedule.` }
    }

    // 2. Check capacity for destination date
    const activeCount = await tx.appointment.count({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: { gte: newStart, lt: newEnd },
        status: { in: ['BOOKED', 'WAITING', 'IN_CONSULTATION'] },
      },
    })

    if (activeCount >= availability.maxAppointments) {
      throw { status: 409, message: 'The chosen slot is fully booked. Please select another date or slot.' }
    }

    // 3. Next queue number for new date
    const lastIssued = await tx.appointment.aggregate({
      where: { doctorId: appointment.doctorId, appointmentDate: { gte: newStart, lt: newEnd } },
      _max: { queueNumber: true },
    })
    const nextQueueNumber = (lastIssued._max.queueNumber ?? 0) + 1

    const durationMinutes = availability.consultationDuration ?? 15
    const slotStartTime = combineDateAndTime(newStart, availability.startTime)
    const scheduledTime = new Date(slotStartTime.getTime() + (nextQueueNumber - 1) * durationMinutes * 60 * 1000)

    // 4. Update the appointment record atomically
    const updated = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        appointmentDate: newStart,
        appointmentTime: slotStartTime,
        scheduledTime,
        estimatedTime: scheduledTime,
        queueNumber: nextQueueNumber,
        status: 'BOOKED',
      },
      include: { doctor: { include: { user: true } } },
    })

    return updated
  })

  // 5. Recalculate queues for both old and new dates!
  await recalculateQueue(oldDoctorId, oldDate)
  await recalculateQueue(updatedAppointment.doctorId, updatedAppointment.appointmentDate)

  emitQueueUpdated(updatedAppointment.doctor.userId, {
    appointmentId: updatedAppointment.id,
    queueNumber: updatedAppointment.queueNumber,
    status: updatedAppointment.status,
  })

  const io = getRealtimeServer()
  if (io) {
    const oldDateStr = oldDate.toISOString().slice(0, 10)
    const newDateStr = updatedAppointment.appointmentDate.toISOString().slice(0, 10)
    const oldSnapshot = await getLiveQueueSnapshot(oldDoctorId, oldDate)
    const newSnapshot = await getLiveQueueSnapshot(updatedAppointment.doctorId, updatedAppointment.appointmentDate)
    io.to(`queue:doctor:${oldDoctorId}:${oldDateStr}`).emit('queue:snapshot', oldSnapshot)
    io.to(`queue:doctor:${updatedAppointment.doctorId}:${newDateStr}`).emit('queue:snapshot', newSnapshot)
  }

  // 6. Send reschedule email safely
  if (updatedAppointment.guestEmail) {
    try {
      const prevDateFormatted = oldDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
      const prevTimeFormatted = appointment.scheduledTime
        ? appointment.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
        : appointment.appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })

      const newDateFormatted = updatedAppointment.appointmentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
      const newTimeFormatted = updatedAppointment.scheduledTime
        ? updatedAppointment.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
        : updatedAppointment.appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })

      await sendGuestRescheduleEmail({
        to: updatedAppointment.guestEmail,
        patientName: updatedAppointment.guestName || 'Patient',
        doctorName: getUserDisplayName(updatedAppointment.doctor.user),
        department: updatedAppointment.doctor.department,
        previousDate: prevDateFormatted,
        previousTime: prevTimeFormatted,
        newDate: newDateFormatted,
        newTime: newTimeFormatted,
        newQueueNumber: updatedAppointment.queueNumber,
        bookingReference: updatedAppointment.bookingReference || 'N/A',
        managementToken: rawToken,
      })
    } catch (err) {
      console.warn('[GuestReschedule] Email confirmation failed:', err instanceof Error ? err.message : err)
    }
  }

  return {
    success: true,
    message: 'Appointment successfully rescheduled.',
    appointmentId: updatedAppointment.id,
    newAppointmentDate: updatedAppointment.appointmentDate.toISOString(),
    newScheduledTime: updatedAppointment.scheduledTime?.toISOString(),
    newQueueNumber: updatedAppointment.queueNumber,
    bookingReference: updatedAppointment.bookingReference,
  }
}
