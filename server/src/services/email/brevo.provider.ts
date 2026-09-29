/**
 * Brevo Email Provider
 *
 * Uses Brevo's HTTP API (via the official @getbrevo/brevo SDK) for production.
 * Requires BREVO_API_KEY environment variable.
 *
 * This provider does NOT use SMTP — it sends emails via Brevo's REST API,
 * which avoids SMTP connection issues on hosting platforms like Render.
 */

import { BrevoClient } from '@getbrevo/brevo'
import { env } from '../../config/env.js'
import type { EmailPayload, EmailProvider, EmailSendResult } from './types.js'

let client: BrevoClient | null = null

const getClient = (): BrevoClient => {
  if (client) return client

  const apiKey = env.BREVO.API_KEY
  if (!apiKey) {
    throw new Error('[BrevoProvider] BREVO_API_KEY is not configured. Cannot send emails in production.')
  }

  client = new BrevoClient({ apiKey })
  return client
}

/**
 * Parse the FROM field into a {name, email} sender object for Brevo.
 *
 * Handles formats like:
 *   - '"ClinicFlow" <no-reply@clinicflow.com>'
 *   - 'no-reply@clinicflow.com'
 */
const parseSender = (from: string): { name: string; email: string } => {
  const match = from.match(/^"?([^"<]*)"?\s*<([^>]+)>$/)
  if (match?.[1] && match[2]) {
    return { name: match[1].trim(), email: match[2].trim() }
  }
  return { name: 'ClinicFlow', email: from.trim() }
}

export const brevoProvider: EmailProvider = {
  name: 'brevo',

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const brevo = getClient()
    const sender = parseSender(env.EMAIL.FROM)

    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: payload.subject,
      htmlContent: payload.html,
      sender,
      to: [{ email: payload.to }],
    })

    return {
      success: true,
      messageId: result.messageId,
      provider: 'brevo',
    }
  },
}
