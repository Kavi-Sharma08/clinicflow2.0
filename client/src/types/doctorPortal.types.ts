export type VerificationStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "VISITING";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type DoctorDocumentType = "MEDICAL_LICENSE" | "GOVERNMENT_ID" | "DEGREE_CERTIFICATE" | "CERTIFICATION" | "OTHER";
export type AppointmentStatus =
  | "BOOKED"
  | "WAITING"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface DoctorDocumentDTO {
  id: string;
  documentType: DoctorDocumentType;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  remarks: string | null;
  uploadedAt: string;
  verifiedAt: string | null;
}

export interface DoctorAvailabilityDTO {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxAppointments: number;
  consultationDuration: number;
}

/** Payload sent to POST /doctor/availability */
export interface CreateAvailabilityPayload {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  maxAppointments: number;
  consultationDuration?: number;
  isAvailable: boolean;
}

/** Shared form values for both create and edit availability forms */
export interface AvailabilityFormValues {
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
  maxAppointments: number | "";
  consultationDuration: number | "";
  isAvailable: boolean;
}

export interface DoctorProfileDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
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
  verificationStatus: Exclude<VerificationStatus, "NOT_SUBMITTED">;
  rejectionReason: string | null;
  submittedAt: string | null;
  documents: DoctorDocumentDTO[];
  availability: DoctorAvailabilityDTO[];
}

export interface DoctorProfilePayload {
  registrationNumber: string;
  medicalCouncilName: string;
  specializations: string[];
  degrees: string[];
  certifications: string[];
  biography?: string | null;
  consultationFee: number;
  practiceStartDate: string;
  department: string;
  designation?: string | null;
  joiningDate: string;
  employmentType: EmploymentType;
  documents: Array<{
    documentType: DoctorDocumentType;
    fileUrl: string;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    remarks?: string | null;
  }>;
}

export interface DoctorDashboardSummaryDTO {
  doctor: {
    id: string;
    fullName: string;
    email: string;
    profileImage: string | null;
    department: string;
    designation: string | null;
    verificationStatus: VerificationStatus;
    consultationFee: number;
    specializations: string[];
  };
  metrics: {
    todayAppointments: number;
    completedToday: number;
    cancelledToday: number;
    activeSlots: number;
    weeklyCapacity: number;
  };
  upcomingAppointments: DoctorAppointmentDTO[];
}

export interface DoctorAppointmentDTO {
  id: string;
  queueNumber: number;
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason: string | null;
  appointmentDate: string;
  appointmentTime: string;
  scheduledTime?: string | null;
  estimatedTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  consultationFee: number;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  patient: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    gender: string;
    bloodGroup: string | null;
    dateOfBirth: string | null;
    profileImage: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  };
}

export interface QueueSnapshot {
  date: string;
  currentPatient: DoctorAppointmentDTO | null;
  nextPatient: DoctorAppointmentDTO | null;
  waitingQueue: DoctorAppointmentDTO[];
  completedQueue: DoctorAppointmentDTO[];
  historyQueue: DoctorAppointmentDTO[];
  summary: {
    totalBooked: number;
    waitingCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
  };
}

export interface PaginatedDoctorAppointmentsDTO {
  data: DoctorAppointmentDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DoctorAppointmentFilters {
  date?: string;
  filters?: string; // JSON array of applied filters
  page?: number;
  limit?: number;
}

export interface AutocompleteOption {
  id: string;
  label: string;
}
