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
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-xl lg:grid-cols-[1fr_0.9fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6 sm:p-8 lg:p-10" noValidate>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Create ClinicFlow account</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Sign up</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the exact account details required by the backend user schema.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CustomMultiSelectField name="role" control={control} placeholder="Select Role" options={ROLE_OPTIONS} isMulti={false} rules={{ required: "Please select a role" }} />
            <CustomMultiSelectField name="gender" control={control} placeholder="Select Gender" options={GENDER_OPTIONS} isMulti={false} rules={{ required: "Please select gender" }} />
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

          <CustomButton type="submit" loading={isSubmitting} loadingText="Creating account..." className="mt-2 rounded-xl">
            Create account
          </CustomButton>

          <p className="text-center text-xs text-slate-500">
            Already have an account? <Link to="/login" className="font-semibold text-blue-700">Sign in</Link>
          </p>
        </form>

        <div className="hidden flex-col justify-between gap-10 bg-slate-950 p-10 text-white lg:flex lg:p-14">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">ClinicFlow</span>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">One account connected to the right onboarding flow.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Doctors complete professional verification after signup. Patients complete clinical profile details after account creation.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold">Backend-compatible payload</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">Signup now sends firstName, middleName, lastName, email, phone, gender, role, and password exactly as the backend controller expects.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
