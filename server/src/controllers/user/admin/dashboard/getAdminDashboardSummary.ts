import { type Request, type Response } from 'express'
import { prisma } from '../../../../db/db.js'
import { getUserDisplayName } from '../../../../utils/userDisplay.js'

const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const startOfTomorrow = () => {
  const tomorrow = startOfToday()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export const getAdminDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const today = startOfToday()
    const tomorrow = startOfTomorrow()

    const [
      totalDoctors,
      pendingDoctorApprovals,
      totalPatients,
      appointmentsToday,
      completedAppointmentsToday,
      cancelledAppointmentsToday,
      activeDoctors,
      recentDoctors,
      recentPatients,
      recentAppointments,
    ] = await Promise.all([
      prisma.doctorProfile.count(),
      prisma.doctorProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.patientProfile.count(),
      prisma.appointment.count({ where: { appointmentDate: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { appointmentDate: { gte: today, lt: tomorrow }, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { appointmentDate: { gte: today, lt: tomorrow }, status: 'CANCELLED' } }),
      prisma.doctorProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.doctorProfile.findMany({
        where: { verificationStatus: 'PENDING' },
        select: {
          id: true,
          createdAt: true,
          user: { select: { firstName: true, middleName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.patientProfile.findMany({
        select: {
          id: true,
          createdAt: true,
          user: { select: { firstName: true, middleName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.appointment.findMany({
        select: {
          id: true,
          createdAt: true,
          status: true,
          patient: { select: { user: { select: { firstName: true, middleName: true, lastName: true, email: true } } } },
          doctor: { select: { user: { select: { firstName: true, middleName: true, lastName: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
    ])

    const completedRate = appointmentsToday > 0 ? Math.round((completedAppointmentsToday / appointmentsToday) * 100) : 0

    const activityFeed = [
      ...recentDoctors.map((doctor) => ({
        id: `doctor-${doctor.id}`,
        label: `${getUserDisplayName(doctor.user)} submitted doctor profile`,
        timestamp: doctor.createdAt.toISOString(),
        type: 'DOCTOR_VERIFICATION',
      })),
      ...recentPatients.map((patient) => ({
        id: `patient-${patient.id}`,
        label: `${getUserDisplayName(patient.user)} registered as patient`,
        timestamp: patient.createdAt.toISOString(),
        type: 'PATIENT_REGISTRATION',
      })),
      ...recentAppointments.map((appointment) => ({
        id: `appointment-${appointment.id}`,
        label: `${getUserDisplayName(appointment.patient.user)} booked with ${getUserDisplayName(appointment.doctor.user)}`,
        timestamp: appointment.createdAt.toISOString(),
        type: `APPOINTMENT_${appointment.status}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8)

    return res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        pendingDoctorApprovals,
        totalPatients,
        appointmentsToday,
        completedAppointmentsToday,
        cancelledAppointmentsToday,
        completedAppointmentsRate: completedRate,
        activeDoctors,
        activityFeed,
      },
    })
  } catch (error) {
    console.error('Admin dashboard summary error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
