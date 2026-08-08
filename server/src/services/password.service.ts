import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/db.js'
import { sendPasswordResetEmail } from './email.service.js'

export const changePassword = async (userId: string, currentPassword?: string, newPassword?: string) => {
  if (!currentPassword) {
    return { success: false, status: 400, field: 'oldPassword', message: 'Current password is required' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, status: 400, field: 'newPassword', message: 'New password must be at least 6 characters long' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { success: false, status: 404, message: 'User not found' }
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
  if (!isCurrentPasswordValid) {
    return { success: false, status: 400, field: 'oldPassword', message: 'Incorrect current password' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  return { success: true, status: 200, message: 'Password updated successfully' }
}

export const requestPasswordReset = async (email?: string) => {
  const genericMessage = 'If an account exists with this email, a password reset link has been sent.'

  if (!email || !email.trim()) {
    return { success: false, status: 400, field: 'email', message: 'Email address is required' }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration

    // Delete any pending tokens for this user before creating a new one
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    }).catch(() => {})

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Send email asynchronously so we don't delay the response or leak timing
    sendPasswordResetEmail(user.email, user.firstName, rawToken).catch((err) => {
      console.error('Failed to send password reset email:', err)
    })
  }

  return { success: true, status: 200, message: genericMessage }
}

export const resetPassword = async (token?: string, newPassword?: string) => {
  if (!token || !token.trim()) {
    return { success: false, status: 400, message: 'Invalid or missing reset token' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, status: 400, field: 'newPassword', message: 'Password must be at least 6 characters long' }
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex')

  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!resetTokenRecord || resetTokenRecord.usedAt !== null || resetTokenRecord.expiresAt < new Date()) {
    return { success: false, status: 400, message: 'Invalid or expired password reset link. Please request a new one.' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password, mark token used, and terminate all active sessions for security
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({
      where: { userId: resetTokenRecord.userId },
    }),
  ])

  return { success: true, status: 200, message: 'Password has been reset successfully. Please sign in with your new password.' }
}
