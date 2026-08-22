import { prisma } from '../db/db.js'
import { getUserDisplayName } from '../utils/userDisplay.js'

export const normalizeDateRange = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export const combineDateAndTime = (date: Date, time: string) => {
  const [hours = '0', minutes = '0'] = time.split(':')
  const combined = new Date(date)
  combined.setUTCHours(Number(hours), Number(minutes), 0, 0)
  return combined
}

const UTC_DAY_INDEX = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const

export const serializeQueueAppointment = (appointment: any) => ({
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
  patient: appointment.patient ? {
    id: appointment.patient.patientId || appointment.patient.id,
    fullName: getUserDisplayName(appointment.patient.user),
    email: appointment.patient.user?.email ?? '',
    phone: appointment.patient.user?.phone ?? '',
    gender: appointment.patient.user?.gender ?? null,
    bloodGroup: appointment.patient.user?.bloodGroup ?? null,
    dateOfBirth: appointment.patient.user?.dateOfBirth ? new Date(appointment.patient.user.dateOfBirth).toISOString() : null,
    profileImage: appointment.patient.user?.profileImage ?? null,
    emergencyContactName: appointment.patient.emergencyContactName ?? null,
    emergencyContactPhone: appointment.patient.emergencyContactPhone ?? null,
  } : null,
})

export const recalculateQueue = async (doctorId: string, date: Date, txClient?: any) => {
  const db = txClient || prisma
  const { start, end } = normalizeDateRange(date)

  const dayOfWeek = UTC_DAY_INDEX[date.getUTCDay()]!
  const availability = await db.doctorAvailability.findFirst({
    where: { doctorId, dayOfWeek, isAvailable: true },
    orderBy: { startTime: 'asc' },
  })

  const duration = availability?.consultationDuration ?? 15
  const startTimeStr = availability?.startTime ?? '09:00'
  const slotStartTime = combineDateAndTime(start, startTimeStr)

  const activeOrInConsultation = await db.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate: { gte: start, lt: end },
      status: 'IN_CONSULTATION',
    },
    orderBy: { actualStartTime: 'desc' },
  })

  const lastCompleted = await db.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate: { gte: start, lt: end },
      status: 'COMPLETED',
    },
    orderBy: { actualEndTime: 'desc' },
  })

  let baselineTime: Date
  if (activeOrInConsultation?.actualStartTime) {
    baselineTime = new Date(activeOrInConsultation.actualStartTime.getTime() + duration * 60 * 1000)
  } else if (lastCompleted?.actualEndTime) {
    baselineTime = new Date(Math.max(lastCompleted.actualEndTime.getTime(), new Date().getTime()))
  } else {
    baselineTime = new Date(Math.max(slotStartTime.getTime(), new Date().getTime()))
  }

  const waitingAppointments = await db.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: start, lt: end },
      status: { in: ['BOOKED', 'WAITING'] },
    },
    orderBy: { queueNumber: 'asc' },
  })

  let currentEta = new Date(baselineTime)
  for (let i = 0; i < waitingAppointments.length; i++) {
    const app = waitingAppointments[i]
    await db.appointment.update({
      where: { id: app.id },
      data: { estimatedTime: currentEta },
    })
    currentEta = new Date(currentEta.getTime() + duration * 60 * 1000)
  }
}

export const getLiveQueueSnapshot = async (doctorId: string, date: Date) => {
  const { start, end } = normalizeDateRange(date)

  const allAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: start, lt: end },
    },
    include: {
      patient: {
        include: { user: true },
      },
    },
    orderBy: { queueNumber: 'asc' },
  })

  const currentPatient = allAppointments.find((a) => a.status === 'IN_CONSULTATION') ?? null
  const waitingQueue = allAppointments.filter((a) => a.status === 'BOOKED' || a.status === 'WAITING')
  const nextPatient = waitingQueue[0] ?? null
  const completed = allAppointments.filter((a) => a.status === 'COMPLETED')
  const cancelled = allAppointments.filter((a) => a.status === 'CANCELLED')
  const noShow = allAppointments.filter((a) => a.status === 'NO_SHOW')

  return {
    date: start.toISOString(),
    currentPatient: currentPatient ? serializeQueueAppointment(currentPatient) : null,
    nextPatient: nextPatient ? serializeQueueAppointment(nextPatient) : null,
    waitingQueue: waitingQueue.map(serializeQueueAppointment),
    completedQueue: completed.map(serializeQueueAppointment),
    historyQueue: [...completed, ...cancelled, ...noShow].map(serializeQueueAppointment),
    summary: {
      totalBooked: allAppointments.length,
      waitingCount: waitingQueue.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      noShowCount: noShow.length,
    },
  }
}

export const getPatientQueueStatus = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { include: { user: true } },
      patient: { include: { user: true } },
    },
  })

  if (!appointment) return null

  const { start, end } = normalizeDateRange(appointment.appointmentDate)

  const inConsultation = await prisma.appointment.findFirst({
    where: {
      doctorId: appointment.doctorId,
      appointmentDate: { gte: start, lt: end },
      status: 'IN_CONSULTATION',
    },
    select: { queueNumber: true, id: true },
  })

  const waitingAheadCount = await prisma.appointment.count({
    where: {
      doctorId: appointment.doctorId,
      appointmentDate: { gte: start, lt: end },
      status: { in: ['BOOKED', 'WAITING'] },
      queueNumber: { lt: appointment.queueNumber },
    },
  })

  let positionInLine = waitingAheadCount + 1
  if (appointment.status === 'IN_CONSULTATION') {
    positionInLine = 0
  } else if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
    positionInLine = -1
  }

  return {
    appointmentId: appointment.id,
    queueNumber: appointment.queueNumber,
    status: appointment.status,
    scheduledTime: appointment.scheduledTime ? appointment.scheduledTime.toISOString() : appointment.appointmentTime.toISOString(),
    estimatedTime: appointment.estimatedTime ? appointment.estimatedTime.toISOString() : null,
    actualStartTime: appointment.actualStartTime ? appointment.actualStartTime.toISOString() : null,
    positionInLine,
    patientsAhead: Math.max(0, waitingAheadCount),
    currentServingQueueNumber: inConsultation?.queueNumber ?? null,
    doctorName: getUserDisplayName(appointment.doctor.user),
    doctorDepartment: appointment.doctor.department,
  }
}
