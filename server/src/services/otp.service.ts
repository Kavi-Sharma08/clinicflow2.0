import { prisma } from '../db/db.js'

const OTP_DURATION_MS = 5 * 60 * 1000
const MAX_OTP_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60 * 1000
const RESEND_WINDOW_MS = 15 * 60 * 1000
const MAX_RESENDS_PER_WINDOW = 3

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

type OtpResult = | { ok: true; otp: string } | { ok: false; reason: string; retryAfterSeconds?: number }
  
export const createOtpForUser = async (userId: string): Promise<string> => {
  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_DURATION_MS)

  await prisma.userOtp.upsert({
    where: { userId },
    update: { otp, expiresAt, attempts: 0, resendCount: 0, lastResendAt: null },
    create: { userId, otp, expiresAt },
  })

  return otp
}

export const resendOtpForUser = async (userId: string): Promise<OtpResult> => {
  const existing = await prisma.userOtp.findUnique({ where: { userId } })

  const now = new Date()

  if (existing) {
    if (existing.lastResendAt) {
      const msSinceLastResend = now.getTime() - existing.lastResendAt.getTime()
      if (msSinceLastResend < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - msSinceLastResend) / 1000)
        return { ok: false, reason: `Please wait ${retryAfterSeconds}s before requesting another code.`, retryAfterSeconds }
      }
    }

    const windowExpired = !existing.lastResendAt || now.getTime() - existing.lastResendAt.getTime() > RESEND_WINDOW_MS

    if (!windowExpired && existing.resendCount >= MAX_RESENDS_PER_WINDOW) {
      const retryAfterSeconds = Math.ceil(
        (RESEND_WINDOW_MS - (now.getTime() - existing.lastResendAt!.getTime())) / 1000
      )
      return {
        ok: false,
        reason: `Too many resend attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
        retryAfterSeconds,
      }
    }

    const nextResendCount = windowExpired ? 1 : existing.resendCount + 1

    if (existing.expiresAt > now) {
      await prisma.userOtp.update({
        where: { userId },
        data: { resendCount: nextResendCount, lastResendAt: now },
      })
      return { ok: true, otp: existing.otp }
    }

    const otp = generateOtp()
    const expiresAt = new Date(now.getTime() + OTP_DURATION_MS)

    await prisma.userOtp.update({
      where: { userId },
      data: { otp, expiresAt, attempts: 0, resendCount: nextResendCount, lastResendAt: now },
    })
    return { ok: true, otp }
  }
  
  const otp = generateOtp()
  const expiresAt = new Date(now.getTime() + OTP_DURATION_MS)

  await prisma.userOtp.create({
    data: { userId, otp, expiresAt, resendCount: 1, lastResendAt: now },
  })
  return { ok: true, otp }
}

export const verifyOtp = async (userId: string, submittedOtp: string) => {
  const record = await prisma.userOtp.findUnique({ where: { userId } })

  if (!record) return { valid: false, reason: 'No OTP found. Please request a new one.' }

  if (record.expiresAt < new Date()) {
    await prisma.userOtp.delete({ where: { userId } })
    return { valid: false, reason: 'OTP expired. Please request a new one.' }
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.userOtp.delete({ where: { userId } })
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new one.' }
  }

  if (record.otp !== submittedOtp) {
    await prisma.userOtp.update({
      where: { userId },
      data: { attempts: { increment: 1 } },
    })
    return { valid: false, reason: 'Incorrect OTP.' }
  }

  await prisma.userOtp.delete({ where: { userId } })
  return { valid: true }
}