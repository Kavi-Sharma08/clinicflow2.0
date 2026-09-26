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

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  );
}

export const handleFormError = (
  error: unknown,
  setError: UseFormSetError<any>, // eslint-disable-line @typescript-eslint/no-explicit-any -- RHF generic form
): void => {
  const { field, message } = isApiError(error)
    ? error.response?.data ?? {}
    : {};

  if (field && message) {
    setError(field, { type: "server", message });
  } else {
    toast.error(message ?? "Something went wrong. Please try again.");
  }
};