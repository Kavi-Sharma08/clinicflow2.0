import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import CustomMultiSelectField from "../custom-fields/CustomMultiSelectField";
import CustomInputField from "../custom-fields/CustomInputField";
import { useUser } from "../../context/UserContext";
import { EMAIL_REGEX } from "../../utils/validation";
import CustomButton from "../custom-fields/CustomButton";
import { handleFormError } from "../../utils/handleFormError";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import type { SelectableRole } from "../../types/role.types";
import { resolveOnboardingRedirect } from "../../routes/resolveOnboardingRedirect";

type RoleOption = { label: string; value: SelectableRole };

type LoginFormValues = {
  email: string;
  password: string;
  role: RoleOption | null;
};

const ROLE_OPTIONS: RoleOption[] = [
  { label: "Patient", value: "PATIENT" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Super Admin", value: "ADMIN" },
];

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      role: null,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
        role: data.role?.value,
      });
      setUser(response.data.data);
      toast.success(response.data.message);
      const role = response.data.data.role;

      if (role === "ADMIN") {
        navigate("/admin");
        return;
      }
      const decision = resolveOnboardingRedirect(response.data.data, "dashboard");
      navigate(
        decision.action === "redirect"
          ? decision.to
          : `/${response.data.data.role.toLowerCase()}/dashboard/${response.data.data.id}`
      );
    } catch (error: any) {
      console.error(error);
      const { field, data: errData } = error.response?.data || {};

      if (field === "email" && errData?.email) {
        setUnverifiedEmail(errData.email);
        return;
      }
      setUnverifiedEmail(null);
      handleFormError(error, setError);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8ff] flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-white rounded-2xl sm:rounded-4xl shadow-xl overflow-hidden">
        <div className="hidden lg:flex bg-linear-to-br from-[#0057A8] via-[#0069bf] to-[#0a7bd1] text-white p-10 lg:p-14 flex-col justify-between gap-10">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/70">ClincFlow</span>
            <h1 className="font-serif text-4xl mt-4 leading-tight">
              Login and manage your queue in minutes.
            </h1>
            <p className="text-white/75 mt-4 text-sm leading-relaxed">
              Pick your role, jump into your dashboard, and keep patients moving with real-time updates.
            </p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-6">
            <p className="text-sm font-semibold">New here?</p>
            <p className="text-xs text-white/70 mt-2">
              Create an account to book appointments or manage your clinic.
            </p>
            <Link
              to="/signup"
              className="inline-flex mt-4 px-5 py-2 rounded-full bg-white text-[#0057A8] text-xs font-semibold"
            >
              Create account
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 sm:p-10 lg:p-14 flex flex-col gap-6"
          noValidate
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b7b94]">Welcome back</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#0A1628] mt-2">Sign in</h2>
          </div>

          <CustomMultiSelectField
            name="role"
            control={control}
            options={ROLE_OPTIONS}
            placeholder="Select Role"
            isMulti={false}
            rules={{ required: "Please select a role" }}
          />

          <CustomInputField
            name="email"
            control={control}
            label="Email address"
            type="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: EMAIL_REGEX,
                message: "Enter a valid email",
              },
            }}
          />

          <CustomInputField
            name="password"
            control={control}
            label="Password"
            type="password"
            rules={{
              required: "Password is required",
            }}
          />

          {unverifiedEmail && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
              Your email isn't verified yet. We've sent a fresh code to{" "}
              <span className="font-medium">{unverifiedEmail}</span>.
              <button
                type="button"
                onClick={() =>
                  navigate("/verify-email", { state: { email: unverifiedEmail } })
                }
                className="ml-1 font-semibold text-[#0057A8] hover:underline"
              >
                Verify now
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#6b7b94]">
            <button type="button" className="text-[#0057A8] font-semibold">
              Forgot password?
            </button>
          </div>

          <CustomButton type="submit" loading={isSubmitting} loadingText="Logging in...">
            Log in
          </CustomButton>

          <p className="text-xs text-center text-[#6b7b94]">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-[#0057A8] font-semibold">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;