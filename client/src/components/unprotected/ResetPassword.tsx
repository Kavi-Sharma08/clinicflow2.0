import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircleIcon, KeyIcon, WarningCircleIcon } from "@phosphor-icons/react";
import api from "../../lib/axios";
import CustomButton from "../custom-fields/CustomButton";
import CustomInputField from "../custom-fields/CustomInputField";
import { handleFormError } from "../../utils/handleFormError";

interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const { control, handleSubmit, setError, watch, formState: { isSubmitting } } = useForm<ResetPasswordValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      toast.error("Reset token is missing or invalid.");
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      toast.success("Password reset successfully!");
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      handleFormError(err, setError);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow-sm ring-1 ring-slate-200/60 sm:rounded-2xl sm:px-10 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <WarningCircleIcon size={32} weight="fill" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Invalid Reset Link</h3>
            <p className="text-sm text-slate-500">
              No password reset token was provided in the link. Please request a new reset link.
            </p>
            <div className="pt-2">
              <Link
                to="/forgot-password"
                className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Request Password Reset
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <KeyIcon size={28} weight="bold" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Please enter and confirm your new password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-sm ring-1 ring-slate-200/60 sm:rounded-2xl sm:px-10">
          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircleIcon size={32} weight="fill" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your password has been updated. You will be redirected to the sign in page shortly.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Sign In Now →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <CustomInputField
                name="newPassword"
                type="password"
                control={control}
                label="New password"
                rules={{
                  required: "New password is required",
                  minLength: { value: 6, message: "Use at least 6 characters" },
                }}
              />

              <CustomInputField
                name="confirmPassword"
                type="password"
                control={control}
                label="Confirm new password"
                rules={{
                  required: "Please confirm your password",
                  validate: (value: string) =>
                    watch("newPassword") === value || "Passwords do not match",
                }}
              />

              <CustomButton type="submit" loading={isSubmitting} loadingText="Resetting password...">
                Reset Password
              </CustomButton>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
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
