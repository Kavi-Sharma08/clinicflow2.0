/**
 * Shared types for the email provider abstraction.
 *
 * Both Gmail and Brevo providers implement the same EmailProvider interface
 * so the rest of the application is completely transport-agnostic.
 */

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string | undefined
  provider: 'gmail' | 'brevo' | 'console'
}

export interface EmailProvider {
  readonly name: string
  send(payload: EmailPayload): Promise<EmailSendResult>
}
