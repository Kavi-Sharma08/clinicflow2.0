/**
 * Centralized Email Service
 *
 * Architecture:
 *   Email Service (this file)
 *     │
 *     ├── Development → Gmail Provider (Nodemailer + Gmail SMTP)
 *     │
 *     └── Production  → Brevo Provider (Brevo HTTP API)
 *
 * All email templates live here. Providers only handle transport.
 * Controllers call the same functions regardless of the active provider.
 */

import { env } from '../../config/env.js'
import type { EmailProvider, EmailSendResult } from './types.js'

// ── Provider Selection ──────────────────────────────────────────────

let resolvedProvider: EmailProvider | null = null

const getProvider = async (): Promise<EmailProvider | null> => {
  if (resolvedProvider) return resolvedProvider

  const providerName = env.EMAIL_PROVIDER

  if (providerName === 'brevo') {
    if (!env.BREVO.API_KEY) {
      console.error('[EmailService] EMAIL_PROVIDER is "brevo" but BREVO_API_KEY is not set.')
      return null
    }
    const { brevoProvider } = await import('./brevo.provider.js')
    resolvedProvider = brevoProvider
    console.log('[EmailService] Using Brevo HTTP API provider')
    return resolvedProvider
  }

  // Gmail / Nodemailer
  const { USER, PASS } = env.EMAIL
  if (!USER || !PASS) {
    if (!env.IS_PRODUCTION) {
      console.warn(
        '[EmailService] EMAIL_USER or EMAIL_APP_PASSWORD not configured. Emails will be logged to console in development.',
      )
    }
    return null
  }

  const { gmailProvider } = await import('./gmail.provider.js')
  resolvedProvider = gmailProvider
  console.log('[EmailService] Using Gmail/Nodemailer SMTP provider')
  return resolvedProvider
}

// ── Core send function ──────────────────────────────────────────────

const sendMailSafe = async (options: {
  to: string
  subject: string
  html: string
  devSummary?: string
}): Promise<EmailSendResult> => {
  const provider = await getProvider()

  // No provider available → dev console fallback
  if (!provider) {
    if (!env.IS_PRODUCTION) {
      console.log(`\n================== [DEV EMAIL] ==================`)
      console.log(`To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      if (options.devSummary) console.log(`Details: ${options.devSummary}`)
      console.log(`=================================================\n`)
      return { success: true, provider: 'console' }
    }
    throw new Error('Email delivery failed: No email provider is configured.')
  }

  try {
    const result = await provider.send({
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return result
  } catch (error) {
    console.error(
      `[EmailService] Failed to send email via ${provider.name} to ${options.to} (${options.subject}):`,
      error instanceof Error ? error.message : error,
    )

    if (!env.IS_PRODUCTION) {
      console.log(`[DEV FALLBACK] Email preview for ${options.to}:`)
      if (options.devSummary) console.log(`Details: ${options.devSummary}`)
    }
    throw error
  }
}

// ── Public Email Functions ──────────────────────────────────────────
// These are the only functions the rest of the application should call.
// The active provider (Gmail or Brevo) is completely transparent.

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

export const sendGuestAppointmentConfirmationEmail = async (params: {
  to: string
  patientName: string
  doctorName: string
  department: string
  clinicAddress?: string | null
  appointmentDate: string
  appointmentTime: string
  bookingReference: string
  queueNumber: number
  managementToken: string
}) => {
  const managementUrl = `${env.CLIENT_URL}/appointments/manage/${params.managementToken}`

  return sendMailSafe({
    to: params.to,
    subject: `Appointment Confirmed: Dr. ${params.doctorName} (${params.bookingReference})`,
    devSummary: `Guest booking confirmed for ${params.patientName} with Dr. ${params.doctorName} (Ref: ${params.bookingReference})`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #0f172a; line-height: 1.5;">
        <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
          <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">ClinicFlow Booking</span>
          <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">Appointment Confirmed</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Hello ${params.patientName}, your clinic appointment is successfully reserved.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Doctor:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Dr. ${params.doctorName} (${params.department})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Booking Reference:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0284c7; letter-spacing: 0.5px;">${params.bookingReference}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Queue Number:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Queue #${params.queueNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date & Time:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${params.appointmentDate} at ${params.appointmentTime}</td>
            </tr>
            ${params.clinicAddress ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Clinic Location:</td>
              <td style="padding: 6px 0; color: #0f172a;">${params.clinicAddress}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Self-Service Management</h3>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">Need to reschedule or cancel? You can securely manage your appointment anytime using the button below:</p>
          <div style="text-align: center;">
            <a href="${managementUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">Manage My Appointment</a>
          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">Please arrive 10 minutes prior to your scheduled time. Show your queue number #${params.queueNumber} at reception.</p>
          <p style="margin: 0;">This email was sent automatically by ClinicFlow. Keep this email for your records.</p>
        </div>
      </div>
    `,
  })
}

export const sendGuestWalkInConfirmationEmail = async (params: {
  to: string
  patientName: string
  doctorName: string
  department: string
  clinicAddress?: string | null
  date: string
  queueNumber: number
  estimatedTime?: string | null
  bookingReference: string
  managementToken: string
}) => {
  const managementUrl = `${env.CLIENT_URL}/appointments/manage/${params.managementToken}`

  return sendMailSafe({
    to: params.to,
    subject: `Queue Joined: Queue #${params.queueNumber} with Dr. ${params.doctorName}`,
    devSummary: `Walk-in queue joined for ${params.patientName} with Dr. ${params.doctorName} (Queue #${params.queueNumber})`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #0f172a; line-height: 1.5;">
        <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
          <span style="display: inline-block; background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Today's Walk-in Queue</span>
          <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">You are in Queue #${params.queueNumber}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Hello ${params.patientName}, you have joined today's walk-in consultation queue.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Doctor:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Dr. ${params.doctorName} (${params.department})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Queue Number:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0284c7; font-size: 18px;">#${params.queueNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Reference:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${params.bookingReference}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a;">${params.date}</td>
            </tr>
            ${params.estimatedTime ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Estimated Wait Time:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #059669;">${params.estimatedTime}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="margin-bottom: 24px; text-align: center;">
          <a href="${managementUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">View Live Queue Status</a>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">Please remain in or near the clinic waiting area. Your turn will be called shortly.</p>
          <p style="margin: 0;">ClinicFlow Real-Time Patient Queue Management.</p>
        </div>
      </div>
    `,
  })
}

export const sendGuestCancellationEmail = async (params: {
  to: string
  patientName: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
  bookingReference: string
  reason?: string | null
}) => {
  return sendMailSafe({
    to: params.to,
    subject: `Appointment Cancelled: Dr. ${params.doctorName} (${params.bookingReference})`,
    devSummary: `Booking cancelled for ${params.patientName} (Ref: ${params.bookingReference})`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #0f172a; line-height: 1.5;">
        <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
          <span style="display: inline-block; background-color: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled</span>
          <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">Appointment Cancelled</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Hello ${params.patientName}, your appointment has been cancelled as requested.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Doctor:</strong> Dr. ${params.doctorName}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Original Time:</strong> ${params.appointmentDate} at ${params.appointmentTime}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Booking Reference:</strong> ${params.bookingReference}</p>
          ${params.reason ? `<p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
        </div>

        <p style="font-size: 13px; color: #64748b; margin: 0;">
          If you need to book a new appointment in the future, you can scan the clinic QR code or visit the clinic booking page at any time.
        </p>
      </div>
    `,
  })
}

export const sendGuestRescheduleEmail = async (params: {
  to: string
  patientName: string
  doctorName: string
  department: string
  previousDate: string
  previousTime: string
  newDate: string
  newTime: string
  newQueueNumber: number
  bookingReference: string
  managementToken: string
}) => {
  const managementUrl = `${env.CLIENT_URL}/appointments/manage/${params.managementToken}`

  return sendMailSafe({
    to: params.to,
    subject: `Appointment Rescheduled: Dr. ${params.doctorName} (${params.bookingReference})`,
    devSummary: `Booking rescheduled for ${params.patientName} (Ref: ${params.bookingReference})`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #0f172a; line-height: 1.5;">
        <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
          <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Rescheduled</span>
          <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">Appointment Rescheduled</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Hello ${params.patientName}, your appointment has been updated to the new time slot below.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Doctor:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Dr. ${params.doctorName} (${params.department})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">New Date & Time:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #047857;">${params.newDate} at ${params.newTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">New Queue Number:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Queue #${params.newQueueNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Previous Slot:</td>
              <td style="padding: 6px 0; color: #94a3b8; text-decoration: line-through;">${params.previousDate} at ${params.previousTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Booking Reference:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0284c7;">${params.bookingReference}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 24px; text-align: center;">
          <a href="${managementUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">Manage Appointment</a>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">ClinicFlow Patient Queue Management.</p>
        </div>
      </div>
    `,
  })
}

