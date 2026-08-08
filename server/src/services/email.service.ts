import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
})

export const sendOtpEmail = async (email: string, otp: string) => {
  await transporter.sendMail({
    from: `"ClinicFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your ClinicFlow verification code',
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
  await transporter.sendMail({
    from: `"ClinicFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your ClinicFlow doctor account has been approved',
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2>You're approved, Dr. ${fullName}</h2>
        <p>Your credentials have been reviewed and approved. You can now log in and access your ClinicFlow dashboard.</p>
      </div>
    `,
  })
}

export const sendDoctorRejectedEmail = async (email: string, fullName: string, reason: string) => {
  await transporter.sendMail({
    from: `"ClinicFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Update on your ClinicFlow doctor verification',
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
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: `"ClinicFlow Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your ClinicFlow password',
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; color: #1e293b;">
        <div style="margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Hello ${firstName}, we received a request to reset the password for your ClinicFlow account.</p>
        </div>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
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