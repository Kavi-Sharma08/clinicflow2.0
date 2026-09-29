/**
 * Gmail Email Provider
 *
 * Uses Nodemailer + Gmail SMTP for local development.
 * Requires EMAIL_USER and EMAIL_APP_PASSWORD environment variables.
 */

import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'
import type { EmailPayload, EmailProvider, EmailSendResult } from './types.js'

let transporter: nodemailer.Transporter | null = null

const getTransporter = (): nodemailer.Transporter => {
  if (transporter) return transporter

  const { USER, PASS, HOST, PORT, SECURE, SERVICE } = env.EMAIL

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

  transporter = nodemailer.createTransport(transportConfig as nodemailer.TransportOptions)
  return transporter
}

export const gmailProvider: EmailProvider = {
  name: 'gmail',

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const transport = getTransporter()

    const info = await transport.sendMail({
      from: env.EMAIL.FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    })

    return {
      success: true,
      messageId: info.messageId as string,
      provider: 'gmail',
    }
  },
}
