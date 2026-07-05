import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const getDayOfWeek = (date: Date) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const
  return days[date.getUTCDay()]
}

const normalizeDateRange = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { specialization, date, search } = req.query
    const parsedDate = typeof date === 'string' ? new Date(date) : null

    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, field: 'date', message: 'Invalid date format' })
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        ...(typeof specialization === 'string' && specialization.trim()
          ? { specializations: { has: specialization.trim() } }
          : {}),
        ...(typeof search === 'string' && search.trim()
          ? {
              user: {
                OR: [
                  { firstName: { contains: search.trim(), mode: 'insensitive' } },
                  { middleName: { contains: search.trim(), mode: 'insensitive' } },
                  { lastName: { contains: search.trim(), mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: true,
        availability: parsedDate
          ? { where: { dayOfWeek: getDayOfWeek(parsedDate), isAvailable: true } }
          : true,
      },
    })

    const data = await Promise.all(
      doctors.map(async (doctor) => {
        let hasCapacity = true
        if (parsedDate) {
          const { start, end } = normalizeDateRange(parsedDate)
          const maxAppointments = doctor.availability.reduce((sum, slot) => sum + slot.maxAppointments, 0)
          const bookedCount = await prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              appointmentDate: { gte: start, lt: end },
              status: 'BOOKED',
            },
          })
          hasCapacity = maxAppointments > bookedCount
        }

        return {
          doctorId: doctor.id,
          userId: doctor.user.id,
          fullName: getUserDisplayName(doctor.user),
          specialization: doctor.specializations[0] ?? null,
          specializations: doctor.specializations,
          currentAffiliation: doctor.department,
          consultationFee: Number(doctor.consultationFee),
          profilePhotoUrl: doctor.user.profileImage,
          hasCapacity,
        }
      }),
    )

    return res.status(200).json({ success: true, data: parsedDate ? data.filter((doctor) => doctor.hasCapacity) : data })
  } catch (error) {
    console.error('Get doctors error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getSpecializations = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.doctorProfile.findMany({
      where: { verificationStatus: 'VERIFIED' },
      select: { specializations: true },
    })

    const data = Array.from(new Set(rows.flatMap((row) => row.specializations))).sort()
    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get specializations error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getApprovedDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { verificationStatus: 'VERIFIED' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })

    const data = doctors.map((doctor) => ({
      doctorId: doctor.id,
      userId: doctor.user.id,
      fullName: getUserDisplayName(doctor.user),
      specialization: doctor.specializations[0] ?? null,
      specializations: doctor.specializations,
      currentAffiliation: doctor.department,
      bio: doctor.biography,
      profilePhotoUrl: doctor.user.profileImage,
      consultationFee: Number(doctor.consultationFee),
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get approved doctors error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const getDoctorAvailabilityForPatient = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params

    if (!doctorId || typeof doctorId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' })
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { id: true, verificationStatus: true },
    })

    if (!doctorProfile || doctorProfile.verificationStatus !== 'VERIFIED') {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    const slots = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctorProfile.id, isAvailable: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today)
      date.setUTCDate(today.getUTCDate() + index)
      return date
    })

    const data = await Promise.all(
      days.flatMap((date) => {
        const dayOfWeek = getDayOfWeek(date)
        const matchingSlots = slots.filter((slot) => slot.dayOfWeek === dayOfWeek)
        return matchingSlots.map(async (slot) => {
          const { start, end } = normalizeDateRange(date)
          const bookedCount = await prisma.appointment.count({
            where: { doctorId, appointmentDate: { gte: start, lt: end }, status: 'BOOKED' },
          })
          return {
            id: slot.id,
            availabilityId: slot.id,
            date: date.toISOString().slice(0, 10),
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxQueueSize: slot.maxAppointments,
            maxAppointments: slot.maxAppointments,
            bookedCount,
          }
        })
      }),
    )

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get doctor availability for patient error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
