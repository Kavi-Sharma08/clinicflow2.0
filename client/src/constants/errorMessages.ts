/**
 * Centralized Error Messages for ClinicFlow
 * 
 * Maps standardized backend error codes and domain actions to user-facing,
 * safe, and actionable messages. Never displays raw database errors or stack traces.
 */

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "The email or password you entered is incorrect. Please try again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
    UNAUTHORIZED: "You must be signed in to perform this action.",
    FORBIDDEN: "You do not have permission to access this resource.",
    EMAIL_ALREADY_EXISTS: "An account with this email address already exists.",
    EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
    OTP_INVALID: "The verification code is invalid or has expired.",
    PASSWORD_RESET_FAILED: "Unable to reset your password. Please request a new link.",
    PASSWORD_UPDATE_FAILED: "Failed to update your password. Please verify your current password.",
  },

  PROFILE: {
    FETCH_FAILED: "Unable to load your profile information. Please refresh the page.",
    UPDATE_FAILED: "Unable to save your profile changes. Please try again.",
    INVALID_DATA: "Please check your profile details and correct any highlighted errors.",
  },

  DOCTOR: {
    FETCH_FAILED: "Unable to load doctor profile. Please try again later.",
    PROFILE_NOT_FOUND: "Doctor profile has not been submitted or cannot be found.",
    VERIFICATION_SUBMIT_FAILED: "Unable to submit your verification details. Please verify all required fields.",
    VERIFICATION_STATUS_FAILED: "Unable to check verification status. Please refresh the page.",
    LIST_FETCH_FAILED: "Unable to load available doctors. Please try again.",
    AVAILABILITY_FETCH_FAILED: "Unable to load availability schedule.",
    AVAILABILITY_CREATE_FAILED: "Unable to create availability slot. Please verify the time range.",
    AVAILABILITY_UPDATE_FAILED: "Unable to update availability slot. Please try again.",
    AVAILABILITY_DELETE_FAILED: "Unable to delete availability slot. Please try again.",
  },

  PATIENT: {
    FETCH_FAILED: "Unable to load patient records. Please try again.",
    NOT_FOUND: "Patient record could not be found.",
    DASHBOARD_FETCH_FAILED: "Unable to load patient dashboard metrics. Please refresh the page.",
  },

  APPOINTMENT: {
    FETCH_FAILED: "Unable to load appointments. Please refresh the page.",
    BOOK_FAILED: "Your appointment could not be booked. The slot may no longer be available.",
    CANCEL_FAILED: "Your appointment could not be cancelled. Please try again.",
    NOT_FOUND: "We couldn't find the appointment you are looking for.",
    STATUS_UPDATE_FAILED: "Unable to update appointment status. Please try again.",
  },

  QUEUE: {
    FETCH_FAILED: "Unable to load live queue. Please check your connection.",
    STATUS_FAILED: "Unable to fetch your position in queue.",
    START_FAILED: "Unable to start consultation. Please try again.",
    COMPLETE_FAILED: "Unable to mark consultation as complete. Please try again.",
    NO_SHOW_FAILED: "Unable to mark patient as no-show. Please try again.",
    CANCEL_FAILED: "Unable to cancel queue entry. Please try again.",
  },

  DOCUMENT: {
    UPLOAD_FAILED: "Document could not be uploaded. Please check file size and format.",
    DELETE_FAILED: "Document could not be removed. Please try again.",
    FETCH_FAILED: "Unable to load verification documents.",
    INVALID_FORMAT: "Please upload a valid document format (PDF, PNG, JPG, or WEBP).",
  },

  ADMIN: {
    SUMMARY_FETCH_FAILED: "Unable to load administrative overview.",
    USERS_FETCH_FAILED: "Unable to load user directory.",
    DOCTOR_ACTION_FAILED: "Unable to update doctor verification status.",
  },

  NETWORK: {
    SERVER_UNAVAILABLE: "ClinicFlow server is temporarily unreachable. Please check your connection.",
    REQUEST_FAILED: "Request failed. Please try again in a moment.",
    TIMEOUT: "The request timed out. Please check your network connection.",
  },

  GENERAL: {
    UNKNOWN: "An unexpected error occurred. Please try again.",
    TRY_AGAIN: "Please try again.",
  },
} as const;

/**
 * Maps known backend error codes to localized user-friendly error messages.
 */
export const BACKEND_ERROR_CODE_MAP: Record<string, string> = {
  // Auth
  AUTH_INVALID_CREDENTIALS: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
  AUTH_SESSION_EXPIRED: ERROR_MESSAGES.AUTH.SESSION_EXPIRED,
  UNAUTHORIZED: ERROR_MESSAGES.AUTH.UNAUTHORIZED,
  FORBIDDEN: ERROR_MESSAGES.AUTH.FORBIDDEN,
  EMAIL_ALREADY_EXISTS: ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS,
  EMAIL_NOT_VERIFIED: ERROR_MESSAGES.AUTH.EMAIL_NOT_VERIFIED,
  INVALID_OTP: ERROR_MESSAGES.AUTH.OTP_INVALID,

  // Profile
  PROFILE_FETCH_FAILED: ERROR_MESSAGES.PROFILE.FETCH_FAILED,
  PROFILE_UPDATE_FAILED: ERROR_MESSAGES.PROFILE.UPDATE_FAILED,
  DOCTOR_PROFILE_NOT_FOUND: ERROR_MESSAGES.DOCTOR.PROFILE_NOT_FOUND,
  DOCTOR_PROFILE_FETCH_FAILED: ERROR_MESSAGES.DOCTOR.FETCH_FAILED,
  DOCTOR_VERIFICATION_SUBMIT_FAILED: ERROR_MESSAGES.DOCTOR.VERIFICATION_SUBMIT_FAILED,

  // Patient
  PATIENT_PROFILE_FETCH_FAILED: ERROR_MESSAGES.PATIENT.FETCH_FAILED,
  PATIENT_NOT_FOUND: ERROR_MESSAGES.PATIENT.NOT_FOUND,

  // Appointment & Queue
  APPOINTMENT_FETCH_FAILED: ERROR_MESSAGES.APPOINTMENT.FETCH_FAILED,
  APPOINTMENT_BOOK_FAILED: ERROR_MESSAGES.APPOINTMENT.BOOK_FAILED,
  APPOINTMENT_CANCEL_FAILED: ERROR_MESSAGES.APPOINTMENT.CANCEL_FAILED,
  APPOINTMENT_NOT_FOUND: ERROR_MESSAGES.APPOINTMENT.NOT_FOUND,
  QUEUE_SNAPSHOT_FAILED: ERROR_MESSAGES.QUEUE.FETCH_FAILED,
  QUEUE_UPDATE_FAILED: ERROR_MESSAGES.QUEUE.STATUS_FAILED,
  QUEUE_START_FAILED: ERROR_MESSAGES.QUEUE.START_FAILED,
  QUEUE_COMPLETE_FAILED: ERROR_MESSAGES.QUEUE.COMPLETE_FAILED,
  QUEUE_NO_SHOW_FAILED: ERROR_MESSAGES.QUEUE.NO_SHOW_FAILED,

  // Availability
  AVAILABILITY_CREATE_FAILED: ERROR_MESSAGES.DOCTOR.AVAILABILITY_CREATE_FAILED,
  AVAILABILITY_UPDATE_FAILED: ERROR_MESSAGES.DOCTOR.AVAILABILITY_UPDATE_FAILED,
  AVAILABILITY_DELETE_FAILED: ERROR_MESSAGES.DOCTOR.AVAILABILITY_DELETE_FAILED,

  // Documents
  DOCUMENT_UPLOAD_FAILED: ERROR_MESSAGES.DOCUMENT.UPLOAD_FAILED,
  DOCUMENT_DELETE_FAILED: ERROR_MESSAGES.DOCUMENT.DELETE_FAILED,

  // Generic
  INTERNAL_SERVER_ERROR: ERROR_MESSAGES.GENERAL.UNKNOWN,
  RESOURCE_NOT_FOUND: ERROR_MESSAGES.APPOINTMENT.NOT_FOUND,
};
