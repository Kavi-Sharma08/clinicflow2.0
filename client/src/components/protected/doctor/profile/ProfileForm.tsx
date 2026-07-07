import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUpdateDoctorProfile, useDoctorProfile } from "../../../../hooks/useDoctorPortal";
import type { DoctorDocumentType, DoctorProfilePayload, EmploymentType } from "../../../../types/doctorPortal.types";
import { EmptyState, SectionCard, SkeletonBlock, StatusBadge, formatCurrency } from "../shared/DoctorPortalAtoms";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "VISITING"];
const DOCUMENT_TYPES: DoctorDocumentType[] = ["MEDICAL_LICENSE", "GOVERNMENT_ID", "DEGREE_CERTIFICATE", "CERTIFICATION", "OTHER"];

const emptyPayload: DoctorProfilePayload = {
  registrationNumber: "",
  medicalCouncilName: "",
  specializations: [],
  degrees: [],
  certifications: [],
  biography: "",
  consultationFee: 0,
  practiceStartDate: "",
  department: "",
  designation: "",
  joiningDate: "",
  employmentType: "FULL_TIME",
  documents: [{ documentType: "MEDICAL_LICENSE", fileUrl: "", remarks: "" }],
};

const toInputDate = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";
const toCsv = (items: string[]) => items.join(", ");
const fromCsv = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

const DoctorProfileForm = () => {
  const { data, isLoading, isError } = useDoctorProfile();
  const updateProfile = useUpdateDoctorProfile();
  const [form, setForm] = useState<DoctorProfilePayload>(emptyPayload);
  const [specializations, setSpecializations] = useState("");
  const [degrees, setDegrees] = useState("");
  const [certifications, setCertifications] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm({
      registrationNumber: data.registrationNumber,
      medicalCouncilName: data.medicalCouncilName,
      specializations: data.specializations,
      degrees: data.degrees,
      certifications: data.certifications,
      biography: data.biography ?? "",
      consultationFee: data.consultationFee,
      practiceStartDate: toInputDate(data.practiceStartDate),
      department: data.department,
      designation: data.designation ?? "",
      joiningDate: toInputDate(data.joiningDate),
      employmentType: data.employmentType,
      documents: data.documents.length ? data.documents.map((document) => ({
        documentType: document.documentType,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        remarks: document.remarks,
      })) : emptyPayload.documents,
    });
    setSpecializations(toCsv(data.specializations));
    setDegrees(toCsv(data.degrees));
    setCertifications(toCsv(data.certifications));
  }, [data]);

  const updateField = <K extends keyof DoctorProfilePayload>(field: K, value: DoctorProfilePayload[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateDocument = (index: number, field: "documentType" | "fileUrl" | "remarks", value: string) => {
    setForm((current) => ({
      ...current,
      documents: current.documents.map((document, documentIndex) =>
        documentIndex === index ? { ...document, [field]: field === "documentType" ? value as DoctorDocumentType : value } : document,
      ),
    }));
  };

  const addDocument = () => {
    setForm((current) => ({
      ...current,
      documents: [...current.documents, { documentType: "OTHER", fileUrl: "", remarks: "" }],
    }));
  };

  const submit = () => {
    const payload: DoctorProfilePayload = {
      ...form,
      consultationFee: Number(form.consultationFee),
      specializations: fromCsv(specializations),
      degrees: fromCsv(degrees),
      certifications: fromCsv(certifications),
      documents: form.documents.filter((document) => document.fileUrl.trim()),
    };

    if (!payload.registrationNumber || !payload.medicalCouncilName || !payload.department || payload.specializations.length === 0 || payload.degrees.length === 0 || payload.documents.length === 0) {
      toast.error("Please complete all required professional profile fields.");
      return;
    }

    updateProfile.mutate(payload);
  };

  if (isLoading) {
    return <div className="space-y-6"><SkeletonBlock className="h-40" /><SkeletonBlock className="h-[520px]" /></div>;
  }

  if (isError && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Complete Doctor Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Submit your clinical profile so admins can review and verify your doctor account.</p>
        </div>
        <EmptyState title="Profile not submitted yet" description="Fill the form below and submit your registration, education, documents, and consultation details." />
        <ProfileEditor form={form} specializations={specializations} degrees={degrees} certifications={certifications} setSpecializations={setSpecializations} setDegrees={setDegrees} setCertifications={setCertifications} updateField={updateField} updateDocument={updateDocument} addDocument={addDocument} submit={submit} isSaving={updateProfile.isPending} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Doctor Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Keep your credentials, public practice details, and verification documents accurate.</p>
        </div>
        {data ? <StatusBadge status={data.verificationStatus} /> : null}
      </div>

      {data ? (
        <SectionCard title="Current profile summary" description="This is the profile currently visible to the admin verification team.">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryItem label="Registration" value={data.registrationNumber} />
            <SummaryItem label="Department" value={data.department} />
            <SummaryItem label="Consultation Fee" value={formatCurrency(data.consultationFee)} />
          </div>
        </SectionCard>
      ) : null}

      <ProfileEditor form={form} specializations={specializations} degrees={degrees} certifications={certifications} setSpecializations={setSpecializations} setDegrees={setDegrees} setCertifications={setCertifications} updateField={updateField} updateDocument={updateDocument} addDocument={addDocument} submit={submit} isSaving={updateProfile.isPending} />
    </div>
  );
};

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

interface ProfileEditorProps {
  form: DoctorProfilePayload;
  specializations: string;
  degrees: string;
  certifications: string;
  setSpecializations: (value: string) => void;
  setDegrees: (value: string) => void;
  setCertifications: (value: string) => void;
  updateField: <K extends keyof DoctorProfilePayload>(field: K, value: DoctorProfilePayload[K]) => void;
  updateDocument: (index: number, field: "documentType" | "fileUrl" | "remarks", value: string) => void;
  addDocument: () => void;
  submit: () => void;
  isSaving: boolean;
}

function ProfileEditor({ form, specializations, degrees, certifications, setSpecializations, setDegrees, setCertifications, updateField, updateDocument, addDocument, submit, isSaving }: ProfileEditorProps) {
  return (
    <SectionCard title="Professional profile details" description="All fields are sent directly to the backend doctor profile contract.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Input label="Registration Number" value={form.registrationNumber} onChange={(value) => updateField("registrationNumber", value)} />
        <Input label="Medical Council Name" value={form.medicalCouncilName} onChange={(value) => updateField("medicalCouncilName", value)} />
        <Input label="Department" value={form.department} onChange={(value) => updateField("department", value)} />
        <Input label="Designation" value={form.designation ?? ""} onChange={(value) => updateField("designation", value)} />
        <Input label="Specializations" helperText="Comma separated values" value={specializations} onChange={setSpecializations} />
        <Input label="Degrees" helperText="Comma separated values" value={degrees} onChange={setDegrees} />
        <Input label="Certifications" helperText="Comma separated values" value={certifications} onChange={setCertifications} />
        <Input label="Consultation Fee" type="number" value={String(form.consultationFee)} onChange={(value) => updateField("consultationFee", Number(value))} />
        <Input label="Practice Start Date" type="date" value={form.practiceStartDate} onChange={(value) => updateField("practiceStartDate", value)} />
        <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(value) => updateField("joiningDate", value)} />
        <label className="text-sm font-semibold text-slate-700">
          Employment Type
          <select value={form.employmentType} onChange={(event) => updateField("employmentType", event.target.value as EmploymentType)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
            {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
          Biography
          <textarea value={form.biography ?? ""} onChange={(event) => updateField("biography", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Documents</h3>
          <button onClick={addDocument} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Add document</button>
        </div>
        <div className="space-y-3">
          {form.documents.map((document, index) => (
            <div key={index} className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[220px_1fr_1fr]">
              <select value={document.documentType} onChange={(event) => updateDocument(index, "documentType", event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input value={document.fileUrl} onChange={(event) => updateDocument(index, "fileUrl", event.target.value)} placeholder="Document URL" className="h-11 rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
              <input value={document.remarks ?? ""} onChange={(event) => updateDocument(index, "remarks", event.target.value)} placeholder="Remarks" className="h-11 rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={submit} disabled={isSaving} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:bg-slate-300">
          {isSaving ? "Submitting..." : "Submit for review"}
        </button>
      </div>
    </SectionCard>
  );
}

function Input({ label, value, onChange, type = "text", helperText }: { label: string; value: string; onChange: (value: string) => void; type?: string; helperText?: string }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      {helperText && <span className="ml-2 text-xs font-normal text-slate-400">({helperText})</span>}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
    </label>
  );
}

export default DoctorProfileForm;
