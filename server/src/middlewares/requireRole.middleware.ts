import { type Request, type Response, type NextFunction } from 'express'
import type { Role } from '../generated/prisma/client.js'

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' })
    }

    next()
  }
}