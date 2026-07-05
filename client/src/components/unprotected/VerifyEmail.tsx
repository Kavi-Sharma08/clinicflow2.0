import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import CustomInputField from "../custom-fields/CustomInputField";
import CustomButton from "../custom-fields/CustomButton";
import { handleFormError } from "../../utils/handleFormError";
import { useUser } from "../../context/UserContext";

interface VerifyEmailFormData {
  otp: string;
}

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const { setUser } = useUser();

  const [isResending, setIsResending] = useState(false);

  const methods = useForm<VerifyEmailFormData>();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setError
  } = methods;

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-[#475569]">
            No email found to verify. Please sign up first.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="mt-2 text-sm font-semibold text-[#0057A8] hover:underline"
          >
            Go to Signup
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      const response = await api.post("/auth/verify-email", {
        email,
        otp: data.otp,
      });

      toast.success(response.data.message);
      const { id, role } = response.data.data;
      setUser(response.data.data);
      navigate(`/${role.toLowerCase()}/dashboard/${id}`);
    } catch (error: any) {
      console.error(error);
      handleFormError(error, setError);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const response = await api.post("/auth/resend-otp", { email });
      toast.success(response.data.message);
    } catch (error: any) {
      console.error(error);
      handleFormError(error, setError);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#d9e6f7] bg-white p-6 sm:p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-2xl grid place-items-center mx-auto mb-4">📧</div>

        <h1 className="text-lg font-semibold text-[#0A1628] text-center">Verify your email</h1>
        <p className="mt-1 text-sm text-[#475569] text-center">
          We've sent a 6-digit code to{" "}
          <span className="font-medium">{email}</span>
        </p>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <CustomInputField
              name="otp"
              control={control}
              label="Verification code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              rules={{
                required: "OTP is required",
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: "OTP must be exactly 6 digits",
                },
              }}
            />

            <CustomButton type="submit" loading={isSubmitting} loadingText="Verifying...">
              Verify
            </CustomButton>
          </form>
        </FormProvider>

        <button
          onClick={handleResendOtp}
          disabled={isResending}
          className="mt-4 w-full text-center text-sm font-medium text-[#0057A8] hover:underline disabled:opacity-60"
        >
          {isResending ? "Resending..." : "Didn't get a code? Resend"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;