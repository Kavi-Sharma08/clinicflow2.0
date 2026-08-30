import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { BACKEND_ERROR_CODE_MAP, ERROR_MESSAGES } from "../constants/errorMessages";

interface BackendErrorPayload {
  success?: boolean;
  code?: string;
  message?: string;
  field?: string;
  errors?: Record<string, string[]>;
}

/**
 * Checks if a string contains raw database or technical details that should never be shown to users.
 */
function isRawInternalError(msg: string): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes("prisma") ||
    lower.includes("syntax error") ||
    lower.includes("column") ||
    lower.includes("database") ||
    lower.includes("p200") ||
    lower.includes("p202") ||
    lower.includes("eaddrinuse") ||
    lower.includes("foreign key") ||
    lower.includes("unique constraint") ||
    lower.includes("invocation") ||
    lower.includes("at ")
  );
}

/**
 * Extracts a safe, user-friendly error message from an unknown error, Axios response, or error code.
 */
export function getErrorMessage(error: unknown, fallbackMessage: string = ERROR_MESSAGES.GENERAL.UNKNOWN): string {
  if (!error) return fallbackMessage;

  // Handle Axios Errors
  if (isAxiosError<BackendErrorPayload>(error)) {
    // Network failure / Server down
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return ERROR_MESSAGES.NETWORK.TIMEOUT;
      }
      return ERROR_MESSAGES.NETWORK.SERVER_UNAVAILABLE;
    }

    const data = error.response.data;

    // 1. Check for known backend error code
    if (data?.code && BACKEND_ERROR_CODE_MAP[data.code]) {
      return BACKEND_ERROR_CODE_MAP[data.code];
    }

    // 2. Check for backend error message (if safe)
    if (data?.message && typeof data.message === "string" && !isRawInternalError(data.message)) {
      return data.message;
    }

    // 3. Fallback based on HTTP Status
    const status = error.response.status;
    if (status === 401) return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
    if (status === 403) return ERROR_MESSAGES.AUTH.FORBIDDEN;
    if (status === 404) return fallbackMessage || "The requested item was not found.";
    if (status >= 500) return ERROR_MESSAGES.NETWORK.SERVER_UNAVAILABLE;
  }

  // Handle standard JavaScript Errors
  if (error instanceof Error) {
    if (!isRawInternalError(error.message)) {
      return error.message;
    }
  }

  return fallbackMessage;
}

/**
 * Displays a sanitized, user-friendly error toast.
 */
export function showErrorToast(error: unknown, fallbackMessage: string = ERROR_MESSAGES.GENERAL.UNKNOWN): void {
  const message = getErrorMessage(error, fallbackMessage);
  toast.error(message);
}
