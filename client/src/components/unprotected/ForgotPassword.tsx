import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, CheckCircleIcon, KeyIcon } from "@phosphor-icons/react";
import api from "../../lib/axios";
import CustomButton from "../custom-fields/CustomButton";
import CustomInputField from "../custom-fields/CustomInputField";
import { handleFormError } from "../../utils/handleFormError";

interface ForgotPasswordValues {
  email: string;
}

export default function ForgotPassword() {
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const { control, handleSubmit, setError, formState: { isSubmitting } } = useForm<ForgotPasswordValues>({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      const response = await api.post("/auth/forgot-password", { email: data.email });
      setSubmittedMessage(response.data.message || "If an account exists with this email, a password reset link has been sent.");
    } catch (err) {
      handleFormError(err, setError);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <KeyIcon size={28} weight="bold" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enter the email associated with your account and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-sm ring-1 ring-slate-200/60 sm:rounded-2xl sm:px-10">
          {submittedMessage ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircleIcon size={32} weight="fill" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Check your email</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {submittedMessage}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeftIcon size={16} />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <CustomInputField
                name="email"
                type="email"
                control={control}
                label="Email address"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                }}
              />

              <CustomButton type="submit" loading={isSubmitting} loadingText="Sending link...">
                Send Reset Link
              </CustomButton>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeftIcon size={14} />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
