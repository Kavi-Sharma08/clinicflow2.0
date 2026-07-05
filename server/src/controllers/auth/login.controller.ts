import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../../db/db.js'
import { createSession, getValidSession } from '../../services/session.service.js'
import { resendOtpForUser } from '../../services/otp.service.js'
import { sendOtpEmail } from '../../services/email.service.js'
import { getUserDisplayName } from '../../utils/userDisplay.js'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email is required' })
    }
    if (!password) {
      return res.status(400).json({ success: false, field: 'password', message: 'Password is required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, field: 'password', message: 'Incorrect password' })
    }

    if (!user.emailVerified) {
      const result = await resendOtpForUser(user.id)
      if (result.ok) {
        await sendOtpEmail(user.email, result.otp)
      }
      const message = result.ok ? 'Please verify your email. We\'ve sent a new code.' : 'Please verify your email.'
      return res.status(403).json({
        success: false,
        field: 'email',
        message,
        data: { email: user.email },
      })
    }

    const existingSessionId = req.cookies?.sessionId
    let session = existingSessionId ? await getValidSession(existingSessionId) : null

    if (!session || session.userId !== user.id) {
      session = await createSession({
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
    }

    let verificationStatus: string | undefined

    if (user.role === 'DOCTOR') {
      const profile = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
        select: { verificationStatus: true },
      })
      verificationStatus = profile?.verificationStatus ?? 'NOT_SUBMITTED'
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        fullName: getUserDisplayName(user),
        email: user.email,
        role: user.role,
        ...(verificationStatus && { verificationStatus }),
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
