import { type Request, type Response } from 'express'
import { prisma } from '../../db/db.js'
import { resendOtpForUser } from '../../services/otp.service.js'
import { sendOtpEmail } from '../../services/email.service.js' 

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email is required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'This email is already verified.' })
    }

    const result = await resendOtpForUser(user.id)

    if (!result.ok) {
      return res.status(429).json({ success: false, field: 'otp', message: result.reason })
    }

    await sendOtpEmail(user.email, result.otp)

    return res.status(200).json({ success: true, message: 'A new code has been sent to your email.' })
  } catch (error) {
    console.error('Resend OTP error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}