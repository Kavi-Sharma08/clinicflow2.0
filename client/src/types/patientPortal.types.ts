export type AppointmentStatus = "BOOKED" | "COMPLETED" | "CANCELLED";
export type AppointmentUrgency = "ROUTINE" | "URGENT";
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

export interface PatientDashboardSummary {
  patientId: string | null;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  todayAppointment: PatientAppointment | null;
  nextAppointment: PatientAppointment | null;
}

export interface PatientDoctor {
  doctorId: string;
  userId: string;
  fullName: string;
  specialization: string | null;
  specializations: string[];
  currentAffiliation: string | null;
  department?: string | null;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  consultationFee: number;
  hasCapacity?: boolean;
}

export interface PatientAvailabilitySlot {
  id: string;
  availabilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxQueueSize: number;
  maxAppointments: number;
  bookedCount: number;
}

export interface PatientAppointment {
  id: string;
  queueNumber: number;
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason?: string | null;
  appointmentDate: string;
  appointmentTime: string;
  consultationFee?: number;
  createdAt?: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  doctor: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    specialization?: string | null;
    specializations?: string[];
    department?: string | null;
    profileImage?: string | null;
  };
}

export interface PatientProfile {
  id: string;
  patientId: string;
  fullName: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  alternatePhone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string | null;
  bloodGroup: BloodGroup | null;
  profileImage: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyRelationship: string | null;
  knownAllergies: string | null;
  chronicConditions: string | null;
  medicalNotes: string | null;
}

export interface PatientProfilePayload {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  phone: string;
  alternatePhone?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: BloodGroup | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyRelationship?: string | null;
  knownAllergies?: string | null;
  chronicConditions?: string | null;
  medicalNotes?: string | null;
}
