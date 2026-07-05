import type { DoctorVerificationStatus } from "./role.types";

export type Gender = "MALE" | "FEMALE" | "OTHER";
export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "VISITING";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type DoctorDocumentType = "MEDICAL_LICENSE" | "GOVERNMENT_ID" | "DEGREE_CERTIFICATE" | "CERTIFICATION" | "OTHER";

export interface AdminDoctorUserDTO {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  bloodGroup: BloodGroup | null;
  nationality: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  profileImage: string | null;
  role: "DOCTOR";
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorDocumentDTO {
  id: string;
  documentType: DoctorDocumentType;
  fileUrl: string;
  remarks: string | null;
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedById: string | null;
}

export interface DoctorAvailabilityDTO {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxAppointments: number;
}

export interface DoctorAppointmentSummaryDTO {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface AdminDoctorProfileDTO {
  id: string;
  userId: string;
  registrationNumber: string;
  medicalCouncilName: string;
  specializations: string[];
  degrees: string[];
  certifications: string[];
  biography: string | null;
  consultationFee: number;
  practiceStartDate: string;
  department: string;
  designation: string | null;
  joiningDate: string;
  employmentType: EmploymentType;
  verificationStatus: Exclude<DoctorVerificationStatus, "NOT_SUBMITTED">;
  createdAt: string;
  updatedAt: string;
  documents: DoctorDocumentDTO[];
  availability: DoctorAvailabilityDTO[];
  appointmentSummary: DoctorAppointmentSummaryDTO;
}

export interface AdminDoctorDetailDTO {
  user: AdminDoctorUserDTO;
  verificationStatus: DoctorVerificationStatus;
  doctorProfile: AdminDoctorProfileDTO | null;
}

export interface ApiEnvelope<TData> {
  success: boolean;
  message?: string;
  data: TData;
}
