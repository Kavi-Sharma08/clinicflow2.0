import { randomUUID } from 'crypto'
import { prisma } from '../db/db.js'

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

interface CreateSessionInput {
  userId: string
  userAgent?: string | undefined
  ipAddress?: string | undefined 
}

export const createSession = async ({ userId, userAgent, ipAddress }: CreateSessionInput) => {
  const session = await prisma.session.create({
    data: {
      id: randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    },
    include: { user: true }, 
  })

  return session
}

export const getValidSession = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return session
}

export const destroySession = async (sessionId: string) => {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
    // session might already be gone — safe to ignore
  })
}