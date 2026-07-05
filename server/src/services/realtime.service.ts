import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import type { Role } from '../generated/prisma/enums.js'

let io: Server | null = null

type SocketUser = {
  userId: string
  role: Role
}

export const initRealtimeServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    const userId = typeof socket.handshake.auth.userId === 'string' ? socket.handshake.auth.userId : undefined
    const role = typeof socket.handshake.auth.role === 'string' ? socket.handshake.auth.role as Role : undefined

    if (!userId || !role) {
      socket.disconnect(true)
      return
    }

    const socketUser: SocketUser = { userId, role }
    socket.data.user = socketUser
    socket.join(`user:${userId}`)
    socket.join(`role:${role}`)

    socket.emit('realtime:ready', { userId, role })
  })

  return io
}

export const getRealtimeServer = () => io

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload)
}

export const emitToRole = (role: Role, event: string, payload: unknown) => {
  io?.to(`role:${role}`).emit(event, payload)
}

export const emitQueueUpdated = (doctorUserId: string, payload: unknown) => {
  emitToUser(doctorUserId, 'queue:updated', payload)
}
