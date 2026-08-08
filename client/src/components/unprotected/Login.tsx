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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa] px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-950/5 ring-1 ring-slate-200 lg:grid lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── Left panel (desktop only) ─────────────────────── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 lg:flex lg:p-14">
          {/* Background glow */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[60px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-600/10 blur-[40px]" />

          <div className="relative">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2.5L17.5 6.25v7.5L10 17.5 2.5 13.75V6.25L10 2.5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 7v6M7 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-white">
                Clinic<span className="text-blue-400">Flow</span>
              </span>
            </div>

            <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight text-white">
              The modern way to manage your clinic queue.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Real-time queue tracking, verified doctors, and seamless patient journeys — all in one place.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Real-time queue updates",
                "Verified doctors only",
                "Instant appointment booking",
                "Complete patient management",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 5l2 2 4-4" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom card */}
          <div className="relative rounded-xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-sm font-semibold text-white">New to ClinicFlow?</p>
            <p className="mt-1 text-xs text-slate-400">
              Create an account to start booking appointments or register your clinic.
            </p>
            <Link
              to="/signup"
              className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Create account →
            </Link>
          </div>
        </div>

        {/* ── Right panel — Form ────────────────────────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-14"
          noValidate
        >
          {/* Header */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              Welcome back
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your portal.
            </p>
          </div>

          {/* Role selector */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              I am a <span className="text-rose-500">*</span>
            </label>
            <CustomMultiSelectField
              name="role"
              control={control}
              options={ROLE_OPTIONS}
              placeholder="Select your role..."
              isMulti={false}
              rules={{ required: "Please select a role" }}
            />
          </div>

          {/* Email */}
          <CustomInputField
            name="email"
            control={control}
            label="Email address"
            type="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: EMAIL_REGEX,
                message: "Enter a valid email address",
              },
            }}
          />

          {/* Password */}
          <CustomInputField
            name="password"
            control={control}
            label="Password"
            type="password"
            rules={{
              required: "Password is required",
            }}
          />

          {/* Email unverified warning */}
          {unverifiedEmail && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Email not verified</p>
              <p className="mt-1 text-xs leading-relaxed">
                We sent a verification code to{" "}
                <span className="font-semibold">{unverifiedEmail}</span>.
              </p>
              <button
                type="button"
                onClick={() => navigate("/verify-email", { state: { email: unverifiedEmail } })}
                className="mt-2 text-xs font-bold text-blue-700 underline-offset-2 hover:underline"
              >
                Verify email now →
              </button>
            </div>
          )}

          {/* Forgot password */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <CustomButton type="submit" loading={isSubmitting} loadingText="Signing in...">
            Sign in
          </CustomButton>

          {/* Sign up link */}
          <p className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-bold text-blue-600 hover:text-blue-700">
              Create one free
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;