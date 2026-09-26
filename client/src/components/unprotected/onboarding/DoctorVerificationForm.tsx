import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import CustomInputField from "../../custom-fields/CustomInputField";
import CustomNumberInputField from "../../custom-fields/CustomNumberInputField";
import CustomFileUploadField from "../../custom-fields/CustomFileUpload";
import CustomTextareaField from "../../custom-fields/CustomTextAreaField";
import CustomTagInputField from "../../custom-fields/CustomTagInputField";
import DatePicker from "../../common/DatePicker";
import CustomButton from "../../custom-fields/CustomButton";
import { useUser } from "../../../context/UserContext";
import { useSubmitDoctorVerification } from "../../../hooks/useSubmitDoctorVerification";
import { useDoctorProfile } from "../../../hooks/useDoctorPortal";
import type { EmploymentType } from "../../../types/doctor.types";
import type { SubmitDoctorVerificationPayload } from "../../../services/doctorVerificationService";

interface DoctorVerificationFormData {
  registrationNumber: string;
  medicalCouncilName: string;
  specializations: string[];
  degrees: string[];
  certifications: string[];
  biography: string;
  consultationFee: number | "";
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

const toInputDate = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const DoctorVerificationForm = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const submitVerification = useSubmitDoctorVerification();
  const { data: existingProfile } = useDoctorProfile();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting },
  } = useForm<DoctorVerificationFormData>({
    defaultValues: {
      registrationNumber: "",
      medicalCouncilName: "",
      specializations: [],
      degrees: [],
      certifications: [],
      biography: "",
      consultationFee: "",
      practiceStartDate: "",
      department: "",
      designation: "",
      joiningDate: "",
      employmentType: "FULL_TIME",
      medicalLicenseUrl: "",
      governmentIdUrl: "",
    },
  });

  useEffect(() => {
    if (!existingProfile) return;

    const licenseDoc = existingProfile.documents.find((d) => d.documentType === "MEDICAL_LICENSE");
    const govtIdDoc = existingProfile.documents.find((d) => d.documentType === "GOVERNMENT_ID");

    reset({
      registrationNumber: existingProfile.registrationNumber || "",
      medicalCouncilName: existingProfile.medicalCouncilName || "",
      specializations: existingProfile.specializations || [],
      degrees: existingProfile.degrees || [],
      certifications: existingProfile.certifications || [],
      biography: existingProfile.biography || "",
      consultationFee: existingProfile.consultationFee ?? "",
      practiceStartDate: toInputDate(existingProfile.practiceStartDate),
      department: existingProfile.department || "",
      designation: existingProfile.designation || "",
      joiningDate: toInputDate(existingProfile.joiningDate),
      employmentType: (existingProfile.employmentType as EmploymentType) || "FULL_TIME",
      medicalLicenseUrl: licenseDoc?.fileUrl || "",
      governmentIdUrl: govtIdDoc?.fileUrl || "",
    });
  }, [existingProfile, reset]);

  const onSubmit = async (data: DoctorVerificationFormData) => {
    const payload: SubmitDoctorVerificationPayload = {
      registrationNumber: data.registrationNumber.trim(),
      medicalCouncilName: data.medicalCouncilName.trim(),
      specializations: data.specializations,
      degrees: data.degrees,
      certifications: data.certifications,
      biography: data.biography.trim() || null,
      consultationFee: Number(data.consultationFee),
      practiceStartDate: data.practiceStartDate,
      department: data.department.trim(),
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-primary-600)]">
            Doctor verification
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#0A1628]">
            Verify your professional profile
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Submit your doctor profile details. Admin will review your registration, documents, experience, and department before activating your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8" noValidate>
          {/* Section 1: Registration & practice */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Registration & practice
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomInputField
                name="registrationNumber"
                control={control}
                label="Registration number"
                placeholder="e.g. MCI-2019-12345"
                floatingLabel={false}
                rules={{ required: "Registration number is required" }}
              />
              <CustomInputField
                name="medicalCouncilName"
                control={control}
                label="Medical council name"
                placeholder="e.g. Delhi Medical Council"
                floatingLabel={false}
                rules={{ required: "Medical council name is required" }}
              />
              <CustomInputField
                name="department"
                control={control}
                label="Department"
                placeholder="e.g. Cardiology"
                floatingLabel={false}
                rules={{ required: "Department is required" }}
              />
              <CustomInputField
                name="designation"
                control={control}
                label="Designation"
                placeholder="e.g. Senior Consultant (optional)"
                floatingLabel={false}
              />
              <CustomNumberInputField
                name="consultationFee"
                control={control}
                label="Consultation fee"
                prefix="₹"
                placeholder="e.g. 500"
                rules={{
                  required: "Consultation fee is required",
                  validate: (val: number | "") => {
                    const num = Number(val);
                    return (!isNaN(num) && num > 0) || "Consultation fee must be greater than 0";
                  },
                }}
              />
              <Controller
                name="employmentType"
                control={control}
                rules={{ required: "Employment type is required" }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Employment type<span className="ml-0.5 text-rose-500">*</span>
                    </label>
                    <select
                      {...field}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                    >
                      <option value="FULL_TIME">Full time</option>
                      <option value="PART_TIME">Part time</option>
                      <option value="VISITING">Visiting</option>
                    </select>
                    {fieldState.error && (
                      <span className="mt-1 block text-xs text-red-600">{fieldState.error.message}</span>
                    )}
                  </div>
                )}
              />
              <Controller
                name="practiceStartDate"
                control={control}
                rules={{ required: "Practice start date is required" }}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Practice start date"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={error?.message}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                )}
              />
              <Controller
                name="joiningDate"
                control={control}
                rules={{ required: "Joining date is required" }}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Joining date"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    error={error?.message}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                )}
              />
            </div>
          </section>

          {/* Section 2: Education & expertise */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Education & expertise
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomTagInputField
                name="specializations"
                control={control}
                label="Specializations"
                placeholder="e.g. Cardiology"
                helperText="Press Enter or comma to add"
                rules={{
                  validate: (tags: string[]) =>
                    (tags && tags.length > 0) || "At least one specialization is required",
                }}
              />
              <CustomTagInputField
                name="degrees"
                control={control}
                label="Degrees"
                placeholder="e.g. MBBS, MD"
                helperText="Press Enter or comma to add"
                rules={{
                  validate: (tags: string[]) =>
                    (tags && tags.length > 0) || "At least one degree is required",
                }}
              />
              <div className="md:col-span-2">
                <CustomTagInputField
                  name="certifications"
                  control={control}
                  label="Certifications"
                  placeholder="e.g. Fellowship in Echo, Board Certified (optional)"
                  helperText="Press Enter or comma to add"
                />
              </div>
              <div className="md:col-span-2">
                <CustomTextareaField
                  name="biography"
                  control={control}
                  label="Biography"
                  placeholder="Describe your clinical experience, special procedures, and patient care focus."
                />
              </div>
            </div>
          </section>

          {/* Section 3: Documents */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Documents
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <CustomFileUploadField
                name="medicalLicenseUrl"
                control={control}
                label="Medical license document"
                uploadFolder="license"
                helperText="PDF, JPG, or PNG · Max 5MB"
                rules={{ required: "Medical license document is required" }}
              />
              <CustomFileUploadField
                name="governmentIdUrl"
                control={control}
                label="Government ID document"
                uploadFolder="govt-id"
                helperText="PDF, JPG, or PNG · Max 5MB"
                rules={{ required: "Government ID document is required" }}
              />
            </div>
          </section>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <CustomButton
              type="submit"
              loading={isSubmitting || submitVerification.isPending}
              loadingText="Submitting..."
              fullWidth={false}
              className="rounded-xl px-8"
            >
              Submit for review
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorVerificationForm;
