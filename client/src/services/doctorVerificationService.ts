import api from "../lib/axios";
import type { DoctorDocumentType, EmploymentType } from "../types/doctor.types";
import type { DoctorVerificationStatus } from "../types/role.types";

export interface SubmitDoctorVerificationPayload {
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
  documents: Array<{
    documentType: DoctorDocumentType;
    fileUrl: string;
    remarks?: string;
  }>;
}

interface SubmitDoctorVerificationResponse {
  success: boolean;
  message: string;
  data: {
    verificationStatus: Exclude<DoctorVerificationStatus, "NOT_SUBMITTED">;
  };
}

export const doctorVerificationService = {
  async submitVerification(payload: SubmitDoctorVerificationPayload): Promise<SubmitDoctorVerificationResponse> {
    const response = await api.post<SubmitDoctorVerificationResponse>("/doctor/verification", payload);
    return response.data;
  },
};
