import { type Request, type Response, type NextFunction } from 'express'
import { getValidSession } from '../services/session.service.js'
import { getUserDisplayName } from '../utils/userDisplay.js'

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.cookies?.sessionId
    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    const session = await getValidSession(sessionId)

    if (!session) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid' })
    }

    req.user = {
      id: session.user.id,
      fullName: getUserDisplayName(session.user),
      email: session.user.email,
      role: session.user.role,
    }

    next()
  } catch (error) {
    console.error('requireAuth error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
