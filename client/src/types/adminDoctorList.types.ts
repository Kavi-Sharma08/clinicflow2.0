import type { AccountStatus, EmploymentType } from "./doctor.types";

export type DoctorListStatus = "ALL" | "PENDING" | "VERIFIED" | "REJECTED";
export type DoctorVerificationStatusValue = "PENDING" | "VERIFIED" | "REJECTED";

export interface AdminDoctorListProfileDTO {
  id: string;
  registrationNumber: string;
  medicalCouncilName: string;
  specializations: string[];
  degrees: string[];
  consultationFee: number;
  department: string;
  designation: string | null;
  employmentType: EmploymentType;
  verificationStatus: DoctorVerificationStatusValue;
  submittedAt: string;
  availableSlotCount: number;
  documentCount: number;
  verifiedDocumentCount: number;
}

export interface AdminDoctorListItemDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string | null;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
  doctorProfile: AdminDoctorListProfileDTO | null;
}

export interface AdminDoctorsPaginationDTO {
  skip: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface AdminDoctorsResponseDTO {
  success: boolean;
  data: AdminDoctorListItemDTO[];
  pagination: AdminDoctorsPaginationDTO;
}

export interface AdminDoctorSummaryDTO {
  totalDoctors: number;
  pendingDoctors: number;
  verifiedDoctors: number;
  rejectedDoctors: number;
  activeAvailability: number;
}
