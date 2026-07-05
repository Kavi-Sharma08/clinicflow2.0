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