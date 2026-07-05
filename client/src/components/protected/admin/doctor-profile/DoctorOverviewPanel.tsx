import type { AdminDoctorDetailDTO } from "../../../../types/doctor.types";
import { bloodGroupLabel, employmentTypeLabel, formatAddress, formatDate } from "./doctorProfileFormatters";
import { InfoField, SectionCard } from "./InfoField";

export function DoctorOverviewPanel({ detail }: { detail: AdminDoctorDetailDTO }) {
  const { user, doctorProfile } = detail;

  if (!doctorProfile) {
    return (
      <SectionCard title="Profile not submitted" description="This doctor has registered but has not submitted professional verification details yet.">
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No doctor profile data is available from the backend.
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Professional Information" description="Core fields coming directly from schema2 DoctorProfile.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoField label="Registration Number" value={doctorProfile.registrationNumber} />
          <InfoField label="Medical Council" value={doctorProfile.medicalCouncilName} />
          <InfoField label="Department" value={doctorProfile.department} />
          <InfoField label="Designation" value={doctorProfile.designation ?? "Not provided"} />
          <InfoField label="Employment Type" value={employmentTypeLabel(doctorProfile.employmentType)} />
          <InfoField label="Joining Date" value={formatDate(doctorProfile.joiningDate)} />
          <InfoField label="Practice Start Date" value={formatDate(doctorProfile.practiceStartDate)} />
          <InfoField label="Account Status" value={user.accountStatus} />
        </div>
      </SectionCard>

      <SectionCard title="About Doctor">
        <p className="text-sm leading-6 text-gray-600">
          {doctorProfile.biography || "No biography has been provided by this doctor."}
        </p>
      </SectionCard>

      <SectionCard title="Contact & Location">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoField label="Email" value={user.email} />
          <InfoField label="Phone" value={user.phone} />
          <InfoField label="Alternate Phone" value={user.alternatePhone ?? "Not provided"} />
          <InfoField label="Date of Birth" value={formatDate(user.dateOfBirth)} />
          <InfoField label="Gender" value={user.gender} />
          <InfoField label="Blood Group" value={bloodGroupLabel(user.bloodGroup)} />
          <InfoField
            label="Address"
            value={formatAddress([user.addressLine1, user.addressLine2, user.city, user.state, user.country, user.postalCode])}
            className="md:col-span-2"
          />
        </div>
      </SectionCard>
    </div>
  );
}
