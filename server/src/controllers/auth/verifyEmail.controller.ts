import { type Request, type Response } from 'express'
import {prisma} from '../../db/db.js'
import { getUserDisplayName } from '../../utils/userDisplay.js'
import { verifyOtp } from '../../services/otp.service.js'
import { createSession } from '../../services/session.service.js'

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body

    if (!email) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email is required' })
    }
    if (!otp) {
      return res.status(400).json({ success: false, field: 'otp', message: 'OTP is required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(404).json({ success: false,  message: 'User not found' })
    }

    const result = await verifyOtp(user.id, otp)

    if (!result.valid) {
      return res.status(400).json({ success: false, field: 'otp', message: result.reason })
    }

    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })

    const session = await createSession({
      userId: user.id,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    })

    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
    })

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: { id: user.id, fullName: getUserDisplayName(user), email: user.email, role: user.role },
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}