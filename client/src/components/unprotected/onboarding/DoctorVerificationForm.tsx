import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import CustomInputField from "../../custom-fields/CustomInputField";
import CustomNumberInputField from "../../custom-fields/CustomNumberInputField";
import CustomFileUploadField from "../../custom-fields/CustomFileUpload";
import CustomTextareaField from "../../custom-fields/CustomTextAreaField";
import CustomButton from "../../custom-fields/CustomButton";
import { useUser } from "../../../context/UserContext";
import { useSubmitDoctorVerification } from "../../../hooks/useSubmitDoctorVerification";
import type { EmploymentType } from "../../../types/doctor.types";
import type { SubmitDoctorVerificationPayload } from "../../../services/doctorVerificationService";

interface DoctorVerificationFormData {
  registrationNumber: string;
  medicalCouncilName: string;
  specializations: string;
  degrees: string;
  certifications: string;
  biography: string;
  consultationFee: number;
  practiceStartDate: string;
  department: string;
  designation: string;
  joiningDate: string;
  employmentType: EmploymentType;
  medicalLicenseUrl: string;
  governmentIdUrl: string;
}

interface ApiFormError {
  field?: keyof DoctorVerificationFormData | "documents";
  message?: string;
}

const parseList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const DoctorVerificationForm = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const submitVerification = useSubmitDoctorVerification();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<DoctorVerificationFormData>({
    defaultValues: {
      registrationNumber: "",
      medicalCouncilName: "",
      specializations: "",
      degrees: "",
      certifications: "",
      biography: "",
      consultationFee: 0,
      practiceStartDate: "",
      department: "",
      designation: "",
      joiningDate: "",
      employmentType: "FULL_TIME",
      medicalLicenseUrl: "",
      governmentIdUrl: "",
    },
  });

  const onSubmit = async (data: DoctorVerificationFormData) => {
    const payload: SubmitDoctorVerificationPayload = {
      registrationNumber: data.registrationNumber,
      medicalCouncilName: data.medicalCouncilName,
      specializations: parseList(data.specializations),
      degrees: parseList(data.degrees),
      certifications: parseList(data.certifications),
      biography: data.biography.trim() || null,
      consultationFee: Number(data.consultationFee),
      practiceStartDate: data.practiceStartDate,
      department: data.department,
      designation: data.designation.trim() || null,
      joiningDate: data.joiningDate,
      employmentType: data.employmentType,
      documents: [
        { documentType: "MEDICAL_LICENSE", fileUrl: data.medicalLicenseUrl },
        { documentType: "GOVERNMENT_ID", fileUrl: data.governmentIdUrl },
      ],
    };

    try {
      const response = await submitVerification.mutateAsync(payload);
      toast.success(response.message);
      setUser((prev) => (prev ? { ...prev, verificationStatus: "PENDING" } : prev));
      navigate("/onboarding/status");
    } catch (error) {
      if (isAxiosError<ApiFormError>(error)) {
        const field = error.response?.data?.field;
        const message = error.response?.data?.message ?? "Something went wrong";
        if (field && field !== "documents") {
          setError(field, { type: "manual", message });
          return;
        }
        toast.error(message);
        return;
      }
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] bg-white p-6 shadow-xl sm:p-8 lg:p-10">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Doctor verification</p>
          <h2 className="mt-2 font-serif text-2xl text-[#0A1628]">Verify your professional profile</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b7b94]">
            Submit your schema2 doctor profile details. Admin will review your registration, documents, experience, and department before activating your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
          <section>
            <h3 className="text-sm font-bold text-[#0A1628]">Registration & practice</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomInputField name="registrationNumber" control={control} label="Registration number" rules={{ required: "Registration number is required" }} />
              <CustomInputField name="medicalCouncilName" control={control} label="Medical council name" rules={{ required: "Medical council name is required" }} />
              <CustomInputField name="department" control={control} label="Department" rules={{ required: "Department is required" }} />
              <CustomInputField name="designation" control={control} label="Designation" />
              <CustomNumberInputField name="consultationFee" control={control} label="Consultation fee" min={0} rules={{ required: "Consultation fee is required" }} />
              <Controller
                name="employmentType"
                control={control}
                rules={{ required: "Employment type is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#0A1628]">Employment type<span className="ml-0.5 text-red-500">*</span></label>
                    <select
                      {...field}
                      className="w-full rounded-md border border-[#d9e6f7] bg-white px-3 py-3 text-sm text-[#0A1628] outline-none transition focus:border-[#0057A8] focus:ring-2 focus:ring-[#cfe5ff]"
                    >
                      <option value="FULL_TIME">Full time</option>
                      <option value="PART_TIME">Part time</option>
                      <option value="VISITING">Visiting</option>
                    </select>
                    {fieldState.error && <span className="mt-1 block text-xs text-red-600">{fieldState.error.message}</span>}
                  </div>
                )}
              />
              <CustomInputField name="practiceStartDate" control={control} label="Practice start date" type="date" rules={{ required: "Practice start date is required" }} />
              <CustomInputField name="joiningDate" control={control} label="Joining date" type="date" rules={{ required: "Joining date is required" }} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#0A1628]">Education & expertise</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomInputField name="specializations" control={control} label="Specializations, comma separated" rules={{ required: "At least one specialization is required" }} />
              <CustomInputField name="degrees" control={control} label="Degrees, comma separated" rules={{ required: "At least one degree is required" }} />
              <CustomInputField name="certifications" control={control} label="Certifications, comma separated" />
              <div className="md:col-span-2">
                <CustomTextareaField name="biography" control={control} label="Biography" placeholder="Describe your clinical experience and focus areas." />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#0A1628]">Documents</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomFileUploadField name="medicalLicenseUrl" control={control} label="Medical license document" uploadFolder="license" rules={{ required: "Medical license document is required" }} />
              <CustomFileUploadField name="governmentIdUrl" control={control} label="Government ID document" uploadFolder="govt-id" rules={{ required: "Government ID document is required" }} />
            </div>
          </section>

          <div className="flex justify-end border-t border-gray-100 pt-6">
            <CustomButton type="submit" loading={isSubmitting || submitVerification.isPending} loadingText="Submitting..." fullWidth={false} className="rounded-xl px-6">
              Submit for review
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorVerificationForm;
