import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usePatientProfile, useUpdatePatientProfile } from "../../../hooks/usePatientPortal";
import type { BloodGroup, PatientProfilePayload } from "../../../types/patientPortal.types";

const BLOOD_GROUPS: BloodGroup[] = ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"];

const inputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100";
const textareaClass = "min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
    {children}
  </label>
);

const PatientProfile = () => {
  const profileQuery = usePatientProfile();
  const updateMutation = useUpdatePatientProfile();
  const { register, handleSubmit, reset } = useForm<PatientProfilePayload>();

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        firstName: profileQuery.data.firstName,
        middleName: profileQuery.data.middleName,
        lastName: profileQuery.data.lastName,
        phone: profileQuery.data.phone,
        alternatePhone: profileQuery.data.alternatePhone,
        dateOfBirth: profileQuery.data.dateOfBirth?.slice(0, 10) ?? null,
        bloodGroup: profileQuery.data.bloodGroup,
        addressLine1: profileQuery.data.addressLine1,
        addressLine2: profileQuery.data.addressLine2,
        city: profileQuery.data.city,
        state: profileQuery.data.state,
        country: profileQuery.data.country,
        postalCode: profileQuery.data.postalCode,
        emergencyContactName: profileQuery.data.emergencyContactName,
        emergencyContactPhone: profileQuery.data.emergencyContactPhone,
        emergencyRelationship: profileQuery.data.emergencyRelationship,
        knownAllergies: profileQuery.data.knownAllergies,
        chronicConditions: profileQuery.data.chronicConditions,
        medicalNotes: profileQuery.data.medicalNotes,
      });
    }
  }, [profileQuery.data, reset]);

  const onSubmit = (values: PatientProfilePayload) => {
    updateMutation.mutate(values, {
      onSuccess: () => toast.success("Patient profile updated"),
      onError: () => toast.error("Unable to update profile"),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Medical identity</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Patient profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Keep your contact, emergency, allergy, and chronic condition details ready for every appointment.</p>
        </div>
        <button disabled={updateMutation.isPending} className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50">
          {updateMutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </section>

      {profileQuery.isLoading ? (
        <div className="h-96 animate-pulse rounded-[2rem] bg-slate-200" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
            <h2 className="text-lg font-bold text-slate-950">Personal information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="First name"><input {...register("firstName", { required: true })} className={inputClass} /></Field>
              <Field label="Middle name"><input {...register("middleName")} className={inputClass} /></Field>
              <Field label="Last name"><input {...register("lastName")} className={inputClass} /></Field>
              <Field label="Phone"><input {...register("phone", { required: true })} className={inputClass} /></Field>
              <Field label="Alternate phone"><input {...register("alternatePhone")} className={inputClass} /></Field>
              <Field label="Date of birth"><input type="date" {...register("dateOfBirth")} className={inputClass} /></Field>
              <Field label="Blood group">
                <select {...register("bloodGroup")} className={inputClass}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
            <h2 className="text-lg font-bold text-slate-950">Emergency contact</h2>
            <div className="mt-5 space-y-4">
              <Field label="Contact name"><input {...register("emergencyContactName")} className={inputClass} /></Field>
              <Field label="Contact phone"><input {...register("emergencyContactPhone")} className={inputClass} /></Field>
              <Field label="Relationship"><input {...register("emergencyRelationship")} className={inputClass} /></Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
            <h2 className="text-lg font-bold text-slate-950">Address</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Address line 1"><input {...register("addressLine1")} className={inputClass} /></Field>
              <Field label="Address line 2"><input {...register("addressLine2")} className={inputClass} /></Field>
              <Field label="City"><input {...register("city")} className={inputClass} /></Field>
              <Field label="State"><input {...register("state")} className={inputClass} /></Field>
              <Field label="Country"><input {...register("country")} className={inputClass} /></Field>
              <Field label="Postal code"><input {...register("postalCode")} className={inputClass} /></Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
            <h2 className="text-lg font-bold text-slate-950">Medical summary</h2>
            <div className="mt-5 space-y-4">
              <Field label="Known allergies"><textarea {...register("knownAllergies")} className={textareaClass} /></Field>
              <Field label="Chronic conditions"><textarea {...register("chronicConditions")} className={textareaClass} /></Field>
              <Field label="Medical notes"><textarea {...register("medicalNotes")} className={textareaClass} /></Field>
            </div>
          </section>
        </div>
      )}
    </form>
  );
};

export default PatientProfile;
