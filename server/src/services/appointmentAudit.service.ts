import { prisma } from '../db/db.js'
import type { AppointmentStatus } from '../generated/prisma/enums.js'

export interface LogAppointmentAuditInput {
  appointmentId: string
  action: string
  previousStatus?: AppointmentStatus | null
  newStatus?: AppointmentStatus | null
  performedById?: string | null
  reason?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

export const logAppointmentAudit = async (
  input: LogAppointmentAuditInput,
  txClient?: any,
) => {
  const db = txClient || prisma
  return db.appointmentAudit.create({
    data: {
      appointmentId: input.appointmentId,
      action: input.action,
      previousStatus: input.previousStatus ?? null,
      newStatus: input.newStatus ?? null,
      performedById: input.performedById ?? null,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      ...(input.metadata ? { metadata: input.metadata as any } : {}),
    },
  })
}

export const getAppointmentAudits = async (appointmentId: string) => {
  return prisma.appointmentAudit.findMany({
    where: { appointmentId },
    include: {
      performedBy: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
