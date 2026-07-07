import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CustomInputField from "../custom-fields/CustomInputField";
import CustomMultiSelectField from "../custom-fields/CustomMultiSelectField";
import CustomButton from "../custom-fields/CustomButton";
import { EMAIL_REGEX } from "../../utils/validation";
import { handleFormError } from "../../utils/handleFormError";
import api from "../../lib/axios";
import { type SelectableRole } from "../../types/role.types";

interface SelectOption<TValue extends string> {
  label: string;
  value: TValue;
}

type RoleOption = SelectOption<Exclude<SelectableRole, "" | "ADMIN">>;
type GenderOption = SelectOption<"MALE" | "FEMALE" | "OTHER">;

interface SignupFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: GenderOption | null;
  password: string;
  confirmPassword: string;
  role: RoleOption | null;
}

const ROLE_OPTIONS: RoleOption[] = [
  { label: "Patient", value: "PATIENT" },
  { label: "Doctor", value: "DOCTOR" },
];

const GENDER_OPTIONS: GenderOption[] = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

const Signup = () => {
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setError,
    watch,
  } = useForm<SignupFormValues>({
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: null,
      password: "",
      confirmPassword: "",
      role: null,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const response = await api.post("/auth/signup", {
        firstName: data.firstName.trim(),
        middleName: data.middleName.trim() || null,
        lastName: data.lastName.trim() || null,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        gender: data.gender?.value,
        password: data.password,
        role: data.role?.value,
      });
      toast.success(response.data.message);
      navigate("/verify-email", { state: { email: data.email.trim().toLowerCase() } });
    } catch (error) {
      handleFormError(error, setError);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa] px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-950/5 ring-1 ring-slate-200 lg:grid lg:grid-cols-[1fr_0.9fr]">
        
        {/* ── Left panel — Form ────────────────────────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-12"
          noValidate
        >
          {/* Header */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              Create account
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Join ClinicFlow
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign up to book appointments or manage your clinic.
            </p>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                I am a <span className="text-rose-500">*</span>
              </label>
              <CustomMultiSelectField
                name="role"
                control={control}
                placeholder="Select Role"
                options={ROLE_OPTIONS}
                isMulti={false}
                rules={{ required: "Please select a role" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Gender <span className="text-rose-500">*</span>
              </label>
              <CustomMultiSelectField
                name="gender"
                control={control}
                placeholder="Select Gender"
                options={GENDER_OPTIONS}
                isMulti={false}
                rules={{ required: "Please select gender" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CustomInputField name="firstName" control={control} label="First name" rules={{ required: "First name is required" }} />
            <CustomInputField name="middleName" control={control} label="Middle name" />
            <CustomInputField name="lastName" control={control} label="Last name" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CustomInputField
              name="email"
              control={control}
              label="Email address"
              type="email"
              rules={{
                required: "Email is required",
                pattern: { value: EMAIL_REGEX, message: "Enter a valid email" },
              }}
            />
            <CustomInputField
              name="phone"
              control={control}
              label="Phone number"
              type="tel"
              rules={{
                required: "Phone number is required",
                minLength: { value: 10, message: "Enter a valid phone number" },
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CustomInputField
              name="password"
              control={control}
              label="Password"
              type="password"
              rules={{ required: "Password is required", minLength: { value: 6, message: "Use at least 6 characters" } }}
            />
            <CustomInputField
              name="confirmPassword"
              control={control}
              label="Confirm password"
              type="password"
              rules={{
                required: "Please confirm your password",
                validate: (value: string) => watch("password") === value || "Passwords do not match",
              }}
            />
          </div>

          <div className="mt-2">
            <CustomButton type="submit" loading={isSubmitting} loadingText="Creating account...">
              Create account
            </CustomButton>
          </div>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </form>

        {/* ── Right panel (desktop only) ─────────────────────── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 lg:flex lg:p-14">
          {/* Background glow */}
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[60px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-600/10 blur-[40px]" />

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
              One account connected to the right onboarding flow.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Doctors complete professional verification after signup. Patients complete clinical profile details after account creation.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Secure email verification",
                "Role-based dashboards",
                "HIPAA-compliant data handling",
                "Instant access to services",
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
        </div>

      </div>
    </div>
  );
};

export default Signup;
