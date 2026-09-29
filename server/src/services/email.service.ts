/**
 * Re-export barrel for backward compatibility.
 *
 * All email logic now lives in ./email/index.ts with the provider abstraction.
 * This file exists so that existing imports from 'services/email.service.js'
 * continue to resolve without requiring changes across every controller.
 */
export {
  sendOtpEmail,
  sendDoctorApprovedEmail,
  sendDoctorRejectedEmail,
  sendPasswordResetEmail,
} from './email/index.js'
