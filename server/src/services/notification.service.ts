import { prisma } from '../db/db.js'
import type { NotificationPriority, NotificationType, Role } from '../generated/prisma/enums.js'
import { emitToRole, emitToUser } from './realtime.service.js'

type CreateNotificationInput = {
  recipientId: string
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}

export const createNotification = async (input: CreateNotificationInput) => {
  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      priority: input.priority ?? 'NORMAL',
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      ...(input.metadata ? { metadata: input.metadata as any } : {}),
    },
  })

  emitToUser(input.recipientId, 'notification:new', notification)
  return notification
}

export const notifyRole = async (
  role: Role,
  input: Omit<CreateNotificationInput, 'recipientId'>,
) => {
  const users = await prisma.user.findMany({ where: { role, accountStatus: 'ACTIVE' }, select: { id: true } })
  const notifications = await prisma.$transaction(
    users.map((user) => prisma.notification.create({
      data: {
        recipientId: user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        priority: input.priority ?? 'NORMAL',
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ...(input.metadata ? { metadata: input.metadata as any } : {}),
      },
    })),
  )

  emitToRole(role, 'notification:new', notifications[0] ?? input)
  return notifications
}
