import { type Request, type Response } from 'express'
import { prisma } from '../../db/db.js'

export const logout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.sessionId

    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } })
    }

    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return res.status(200).json({ success: true, message: 'Logged out' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}