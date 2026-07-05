import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

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
    include: {
      user: true,
      availability: true,
    },
  })

export const getDoctorDashboardSummary = async (req: Request, res: Response) => {
  try {
    const doctor = await getDoctorProfile(req.user!.id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile has not been submitted yet' })
    }

    const today = new Date()
    const { start, end } = normalizeDateRange(today)

    const [todayAppointments, completedToday, cancelledToday, upcomingAppointments] = await Promise.all([
      prisma.appointment.count({ where: { doctorId: doctor.id, appointmentDate: { gte: start, lt: end } } }),
      prisma.appointment.count({ where: { doctorId: doctor.id, appointmentDate: { gte: start, lt: end }, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { doctorId: doctor.id, appointmentDate: { gte: start, lt: end }, status: 'CANCELLED' } }),
      prisma.appointment.findMany({
        where: { doctorId: doctor.id, appointmentDate: { gte: start }, status: 'BOOKED' },
        orderBy: [{ appointmentDate: 'asc' }, { queueNumber: 'asc' }],
        take: 6,
        include: { patient: { include: { user: true } } },
      }),
    ])

    const activeSlots = doctor.availability.filter((slot) => slot.isAvailable)
    const totalCapacity = activeSlots.reduce((sum, slot) => sum + slot.maxAppointments, 0)

    return res.status(200).json({
      success: true,
      data: {
        doctor: {
          id: doctor.id,
          fullName: getUserDisplayName(doctor.user),
          email: doctor.user.email,
          profileImage: doctor.user.profileImage ?? null,
          department: doctor.department,
          designation: doctor.designation,
          verificationStatus: doctor.verificationStatus,
          consultationFee: Number(doctor.consultationFee),
          specializations: doctor.specializations,
        },
        metrics: {
          todayAppointments,
          completedToday,
          cancelledToday,
          activeSlots: activeSlots.length,
          weeklyCapacity: totalCapacity,
        },
        upcomingAppointments: upcomingAppointments.map((appointment) => ({
          id: appointment.id,
          queueNumber: appointment.queueNumber,
          patientName: getUserDisplayName(appointment.patient.user),
          patientPhone: appointment.patient.user.phone,
          appointmentDate: appointment.appointmentDate.toISOString(),
          appointmentTime: appointment.appointmentTime.toISOString(),
          status: appointment.status,
          notes: appointment.notes,
        })),
      },
    })
  } catch (error) {
    console.error('Doctor dashboard summary error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
