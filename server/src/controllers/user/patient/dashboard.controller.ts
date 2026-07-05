import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'

const normalizeToday = () => {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export const getPatientDashboardSummary = async (req: Request, res: Response) => {
  try {
    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: req.user!.id } })
    if (!patientProfile) {
      return res.status(200).json({
        success: true,
        data: {
          patientId: null,
          upcomingCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          todayAppointment: null,
          nextAppointment: null,
        },
      })
    }

    const { start, end } = normalizeToday()
    const [upcomingCount, completedCount, cancelledCount, todayAppointment, nextAppointment] = await Promise.all([
      prisma.appointment.count({ where: { patientId: patientProfile.id, status: 'BOOKED' } }),
      prisma.appointment.count({ where: { patientId: patientProfile.id, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { patientId: patientProfile.id, status: 'CANCELLED' } }),
      prisma.appointment.findFirst({
        where: { patientId: patientProfile.id, appointmentDate: { gte: start, lt: end }, status: 'BOOKED' },
        orderBy: { queueNumber: 'asc' },
        include: { doctor: { include: { user: true } } },
      }),
      prisma.appointment.findFirst({
        where: { patientId: patientProfile.id, status: 'BOOKED', appointmentDate: { gte: start } },
        orderBy: [{ appointmentDate: 'asc' }, { queueNumber: 'asc' }],
        include: { doctor: { include: { user: true } } },
      }),
    ])

    const serialize = (appointment: typeof todayAppointment) => appointment ? {
      id: appointment.id,
      queueNumber: appointment.queueNumber,
      appointmentDate: appointment.appointmentDate.toISOString(),
      appointmentTime: appointment.appointmentTime.toISOString(),
      status: appointment.status,
      doctor: {
        id: appointment.doctor.id,
        fullName: [appointment.doctor.user.firstName, appointment.doctor.user.middleName, appointment.doctor.user.lastName].filter(Boolean).join(' '),
        specializations: appointment.doctor.specializations,
      },
    } : null

    return res.status(200).json({
      success: true,
      data: {
        patientId: patientProfile.patientId,
        upcomingCount,
        completedCount,
        cancelledCount,
        todayAppointment: serialize(todayAppointment),
        nextAppointment: serialize(nextAppointment),
      },
    })
  } catch (error) {
    console.error('Patient dashboard summary error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
