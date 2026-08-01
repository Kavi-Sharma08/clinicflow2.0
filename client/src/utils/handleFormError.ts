import { type UseFormSetError } from "react-hook-form";
import toast from "react-hot-toast";

interface ApiErrorResponseData {
  field?: string;
  message?: string;
}

interface ApiError {
  response?: {
    data?: ApiErrorResponseData;
  };
}

/**
 * Maps a backend API error to either a field-level RHF error or a toast notification.
 * Backend errors with a `field` key are set on that form field; others fall through to toast.
 */
export const handleFormError = (
  error: ApiError,
  setError: UseFormSetError<any>, // eslint-disable-line @typescript-eslint/no-explicit-any -- RHF generic form
): void => {
  const { field, message } = error.response?.data ?? {};

  if (field && message) {
    setError(field, { type: "server", message });
  } else {
    toast.error(message ?? "Something went wrong. Please try again.");
  }
};