import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { PlusIcon, UserCircleIcon, EyeIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useUpdateDoctorProfile, useDoctorProfile } from "../../../../hooks/useDoctorPortal";
import type { DoctorProfilePayload, EmploymentType } from "../../../../types/doctorPortal.types";
import { EmptyState, SectionCard, SkeletonBlock, StatusBadge, formatCurrency } from "../shared/DoctorPortalAtoms";
import DocumentCard, { type DocumentCardItem } from "./DocumentCard";
import DocumentPreviewModal from "./DocumentPreviewModal";
import DeleteDocumentModal from "./DeleteDocumentModal";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "VISITING"];

interface FormValues {
  registrationNumber: string;
  medicalCouncilName: string;
  department: string;
  designation: string;
  specializations: string;
  degrees: string;
  certifications: string;
  consultationFee: number;
  practiceStartDate: string;
  joiningDate: string;
  employmentType: EmploymentType;
  biography: string;
  documents: DocumentCardItem[];
}

const emptyValues: FormValues = {
  registrationNumber: "",
  medicalCouncilName: "",
  department: "",
  designation: "",
  specializations: "",
  degrees: "",
  certifications: "",
  consultationFee: 0,
  practiceStartDate: "",
  joiningDate: "",
  employmentType: "FULL_TIME",
  biography: "",
  documents: [{ documentType: "MEDICAL_LICENSE", fileUrl: "", remarks: "", isExisting: false }],
};

const toInputDate = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const toCsv = (items?: string[]) => (items ? items.join(", ") : "");
const fromCsv = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

const DoctorProfileForm = () => {
  const { data, isLoading } = useDoctorProfile();
  const updateProfile = useUpdateDoctorProfile();

  // Preview Modal state
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: "",
    url: "",
  });

  // Delete Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number; title: string }>({
    isOpen: false,
    index: -1,
    title: "",
  });

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    defaultValues: emptyValues,
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "documents",
  });

  useEffect(() => {
    if (!data) return;

    reset({
      registrationNumber: data.registrationNumber || "",
      medicalCouncilName: data.medicalCouncilName || "",
      department: data.department || "",
      designation: data.designation || "",
      specializations: toCsv(data.specializations),
      degrees: toCsv(data.degrees),
      certifications: toCsv(data.certifications),
      consultationFee: data.consultationFee || 0,
      practiceStartDate: toInputDate(data.practiceStartDate),
      joiningDate: toInputDate(data.joiningDate),
      employmentType: data.employmentType || "FULL_TIME",
      biography: data.biography || "",
      documents: data.documents.length
        ? data.documents.map((doc) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            remarks: doc.remarks,
            isExisting: true,
          }))
        : emptyValues.documents,
    });
  }, [data, reset]);

  const openPreview = (title: string, url: string) => {
    if (!url) {
      toast.error("No document file available to preview.");
      return;
    }
    setPreviewModal({ isOpen: true, title, url });
  };

  const closePreview = () => {
    setPreviewModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRemoveClick = (index: number) => {
    const item = fields[index];
    if (item.isExisting) {
      // Saved document -> confirm before removing
      setDeleteModal({
        isOpen: true,
        index,
        title: item.documentType.replace("_", " "),
      });
    } else {
      // Newly added unsaved document -> remove directly
      remove(index);
    }
  };

  const confirmDelete = () => {
    if (deleteModal.index >= 0) {
      remove(deleteModal.index);
      toast.success("Document removed from form.");
    }
  };

  const onSubmit = (values: FormValues) => {
    const parsedSpecializations = fromCsv(values.specializations);
    const parsedDegrees = fromCsv(values.degrees);
    const parsedCertifications = fromCsv(values.certifications);
    const validDocuments = values.documents.filter((doc) => doc.fileUrl && doc.fileUrl.trim());

    if (!values.registrationNumber.trim()) {
      toast.error("Registration number is required.");
      return;
    }
    if (!values.medicalCouncilName.trim()) {
      toast.error("Medical council name is required.");
      return;
    }
    if (!values.department.trim()) {
      toast.error("Department is required.");
      return;
    }
    if (parsedSpecializations.length === 0) {
      toast.error("At least one specialization is required.");
      return;
    }
    if (parsedDegrees.length === 0) {
      toast.error("At least one degree is required.");
      return;
    }
    if (validDocuments.length === 0) {
      toast.error("At least one verification document with an uploaded file is required.");
      return;
    }

    const payload: DoctorProfilePayload = {
      registrationNumber: values.registrationNumber.trim(),
      medicalCouncilName: values.medicalCouncilName.trim(),
      department: values.department.trim(),
      designation: values.designation.trim() || null,
      specializations: parsedSpecializations,
      degrees: parsedDegrees,
      certifications: parsedCertifications,
      consultationFee: Number(values.consultationFee),
      practiceStartDate: values.practiceStartDate,
      joiningDate: values.joiningDate,
      employmentType: values.employmentType,
      biography: values.biography.trim() || null,
      documents: validDocuments.map((doc) => ({
        documentType: doc.documentType,
        fileUrl: doc.fileUrl.trim(),
        fileName: doc.fileName || null,
        mimeType: doc.mimeType || null,
        fileSize: doc.fileSize || null,
        remarks: doc.remarks?.trim() || null,
      })),
    };

    updateProfile.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-44 rounded-3xl" />
        <SkeletonBlock className="h-[500px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Doctor Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Doctor Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your clinical profile, credentials, and verification documents.
          </p>
        </div>
        {data ? <StatusBadge status={data.verificationStatus} /> : null}
      </div>

      {/* Rejection Alert Banner */}
      {data?.verificationStatus === "REJECTED" && data.rejectionReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 shadow-sm">
          <WarningCircleIcon size={24} weight="bold" className="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold">Verification Request Rejected</h3>
            <p className="mt-1 text-xs leading-relaxed text-rose-700">{data.rejectionReason}</p>
            <p className="mt-2 text-[11px] font-semibold text-rose-800">
              Please update your profile details or upload valid documents and submit for review.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header & Summary */}
      {data && (
        <SectionCard title="Doctor Profile Summary" description="Overview of your verified credentials visible to administrators.">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Profile Avatar / Photo */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 lg:border-b-0 lg:border-r lg:pr-6 lg:pb-0">
              <div
                onClick={() => data.profileImage && openPreview(`${data.fullName}'s Photo`, data.profileImage)}
                className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-white bg-blue-50 text-blue-600 shadow-md ${
                  data.profileImage ? "cursor-pointer hover:opacity-90 transition" : ""
                }`}
                title={data.profileImage ? "Click to enlarge photo" : "Profile Photo"}
              >
                {data.profileImage ? (
                  <img src={data.profileImage} alt={data.fullName} className="h-full w-full object-cover" />
                ) : (
                  <UserCircleIcon size={48} weight="duotone" />
                )}
                {data.profileImage && (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity hover:opacity-100 text-white">
                    <EyeIcon size={20} weight="bold" />
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-950">{data.fullName}</h2>
                <p className="text-xs font-semibold text-blue-600">{data.department || "Clinical Doctor"}</p>
                <p className="mt-1 text-xs text-slate-500">{data.email}</p>
                {data.phone && <p className="text-xs text-slate-400">{data.phone}</p>}
              </div>
            </div>

            {/* Quick Metrics Summary */}
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryItem label="Registration No." value={data.registrationNumber} />
              <SummaryItem label="Department" value={data.department} />
              <SummaryItem label="Consultation Fee" value={formatCurrency(data.consultationFee)} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard title="Professional Profile Details" description="Update your clinical qualifications and public practice information.">
          <div className="grid gap-5 lg:grid-cols-2">
            <Controller
              name="registrationNumber"
              control={control}
              rules={{ required: "Registration number is required" }}
              render={({ field, fieldState }) => (
                <Input label="Registration Number" required value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="medicalCouncilName"
              control={control}
              rules={{ required: "Medical council name is required" }}
              render={({ field, fieldState }) => (
                <Input label="Medical Council Name" required value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="department"
              control={control}
              rules={{ required: "Department is required" }}
              render={({ field, fieldState }) => (
                <Input label="Department" required value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="designation"
              control={control}
              render={({ field }) => (
                <Input label="Designation" value={field.value} onChange={field.onChange} helperText="e.g. Senior Consultant" />
              )}
            />
            <Controller
              name="specializations"
              control={control}
              rules={{ required: "At least one specialization is required" }}
              render={({ field, fieldState }) => (
                <Input label="Specializations" required helperText="Comma separated" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="degrees"
              control={control}
              rules={{ required: "At least one degree is required" }}
              render={({ field, fieldState }) => (
                <Input label="Degrees" required helperText="Comma separated (e.g. MBBS, MD)" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="certifications"
              control={control}
              render={({ field }) => (
                <Input label="Certifications" helperText="Comma separated" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name="consultationFee"
              control={control}
              rules={{ required: "Consultation fee is required", min: { value: 0, message: "Fee cannot be negative" } }}
              render={({ field, fieldState }) => (
                <Input label="Consultation Fee (₹)" type="number" required value={String(field.value)} onChange={(v) => field.onChange(Number(v))} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="practiceStartDate"
              control={control}
              rules={{ required: "Practice start date is required" }}
              render={({ field, fieldState }) => (
                <Input label="Practice Start Date" type="date" required value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="joiningDate"
              control={control}
              rules={{ required: "Joining date is required" }}
              render={({ field, fieldState }) => (
                <Input label="Joining Date" type="date" required value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
              )}
            />

            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <label className="text-xs font-bold text-slate-700">
                  Employment Type <span className="text-red-500">*</span>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            />

            <Controller
              name="biography"
              control={control}
              render={({ field }) => (
                <label className="text-xs font-bold text-slate-700 lg:col-span-2">
                  Biography
                  <textarea
                    value={field.value}
                    onChange={field.onChange}
                    rows={4}
                    placeholder="Brief description of your background, experience, and clinical focus areas..."
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </label>
              )}
            />
          </div>

          {/* Verification Documents Section */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Verification Documents</h3>
                <p className="text-xs text-slate-500">Upload your license, degree certificates, and identity documents for admin verification.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  append({
                    documentType: "OTHER",
                    fileUrl: "",
                    remarks: "",
                    isExisting: false,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                <PlusIcon size={16} weight="bold" /> Add document
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {fields.length === 0 ? (
                <EmptyState
                  title="No documents attached"
                  description="Click 'Add document' above to attach your medical license or certification files."
                />
              ) : (
                fields.map((fieldItem, index) => (
                  <DocumentCard
                    key={fieldItem.id}
                    document={fieldItem}
                    onChangeDocumentType={(type) =>
                      update(index, { ...fieldItem, documentType: type })
                    }
                    onChangeFileUrl={(url, fileName) =>
                      update(index, { ...fieldItem, fileUrl: url, fileName: fileName ?? fieldItem.fileName })
                    }
                    onChangeRemarks={(remarks) =>
                      update(index, { ...fieldItem, remarks })
                    }
                    onRemove={() => handleRemoveClick(index)}
                    onPreview={openPreview}
                  />
                ))
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:bg-slate-300 cursor-pointer"
            >
              {updateProfile.isPending ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        </SectionCard>
      </form>

      {/* Lightbox Document & Photo Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreview}
        title={previewModal.title}
        fileUrl={previewModal.url}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDocumentModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        documentTitle={deleteModal.title}
      />
    </div>
  );
};

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 truncate">{value || "—"}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  helperText,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {helperText && <span className="ml-1.5 font-normal text-slate-400">({helperText})</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 h-11 w-full rounded-2xl border bg-white px-3 text-xs text-slate-900 outline-none transition ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        }`}
      />
      {error && <span className="mt-1 block text-[11px] font-medium text-red-500">{error}</span>}
    </label>
  );
}

export default DoctorProfileForm;
