import { type UseFormSetError } from "react-hook-form";
import toast from "react-hot-toast";

export const handleFormError = (error: any, setError: UseFormSetError<any>) => {
  const { field, message } = error.response?.data || {};

  if (field) {
    setError(field, { type: "manual", message });
  } else {
    toast.error(message || "Something went wrong");
  }
};