import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter: nodemailer.Transporter | null = null

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter

  const { USER, PASS, HOST, PORT, SECURE, SERVICE } = env.EMAIL

  if (!USER || !PASS) {
    if (!env.IS_PRODUCTION) {
      console.warn('[EmailService] EMAIL_USER or EMAIL_APP_PASSWORD not configured. Emails will be logged to console in development.')
    }
    return null
  }

  const transportConfig = SERVICE
    ? {
        service: SERVICE,
        auth: { user: USER, pass: PASS },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      }
    : {
        host: HOST,
        port: PORT,
        secure: SECURE,
        auth: { user: USER, pass: PASS },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      }

  transporter = nodemailer.createTransport(transportConfig as any)
  return transporter
}

const sendMailSafe = async (options: {
  to: string
  subject: string
  html: string
  devSummary?: string
}) => {
  const mailTransporter = getTransporter()

  if (!mailTransporter) {
    if (!env.IS_PRODUCTION) {
      console.log(`\n================== [DEV EMAIL] ==================`)
      console.log(`To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      if (options.devSummary) console.log(`Details: ${options.devSummary}`)
      console.log(`=================================================\n`)
      return { success: true, simulated: true }
    }
    throw new Error('Email delivery failed: Email credentials not configured.')
  }

  try {
    const info = await mailTransporter.sendMail({
      from: env.EMAIL.FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${options.to} (${options.subject}):`, error)
    if (!env.IS_PRODUCTION) {
      console.log(`[DEV FALLBACK] Email preview for ${options.to}:`)
      if (options.devSummary) console.log(`Details: ${options.devSummary}`)
    }
    throw error
  }
}

export const sendOtpEmail = async (email: string, otp: string) => {
  return sendMailSafe({
    to: email,
    subject: 'Your ClinicFlow verification code',
    devSummary: `OTP: ${otp}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}

export const sendDoctorApprovedEmail = async (email: string, fullName: string) => {
  return sendMailSafe({
    to: email,
    subject: 'Your ClinicFlow doctor account has been approved',
    devSummary: `Doctor approved: Dr. ${fullName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2>You're approved, Dr. ${fullName}</h2>
        <p>Your credentials have been reviewed and approved. You can now log in and access your ClinicFlow dashboard.</p>
      </div>
    `,
  })
}

export const sendDoctorRejectedEmail = async (email: string, fullName: string, reason: string) => {
  return sendMailSafe({
    to: email,
    subject: 'Update on your ClinicFlow doctor verification',
    devSummary: `Doctor rejected: Dr. ${fullName} (Reason: ${reason})`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2>We need a bit more from you, Dr. ${fullName}</h2>
        <p>Your verification application could not be approved for the following reason:</p>
        <p style="background:#fef2f2; padding:12px; border-radius:8px; color:#7f1d1d;">${reason}</p>
        <p>You can log in and resubmit your details to try again.</p>
      </div>
    `,
  })
}

export const sendPasswordResetEmail = async (email: string, firstName: string, resetToken: string) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`

  if (!env.IS_PRODUCTION) {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`)
  }

  return sendMailSafe({
    to: email,
    subject: 'Reset your ClinicFlow password',
    devSummary: `Reset link: ${resetUrl}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #1e293b;">
        <div style="margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Hello ${firstName}, we received a request to reset the password for your ClinicFlow account.</p>
        </div>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            <strong>Important:</strong> This link will expire in <strong>1 hour</strong> and can only be used once.
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
        </p>
      </div>
    `,
  })
}
