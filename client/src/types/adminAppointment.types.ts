export type AppointmentStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type RescheduleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface AdminAppointmentPatient {
  id: string;
  patientId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyRelationship?: string | null;
}

export interface AdminAppointmentDoctor {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation?: string | null;
  specializations: string[];
  consultationFee: number;
  profileImage?: string | null;
}

export interface AppointmentAuditEntry {
  id: string;
  action: string;
  previousStatus?: AppointmentStatus | null;
  newStatus?: AppointmentStatus | null;
  reason?: string | null;
  notes?: string | null;
  performedBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
}

export interface AdminAppointment {
  id: string;
  queueNumber: number;
  status: AppointmentStatus;
  urgency: 'ROUTINE' | 'URGENT';
  notes?: string | null;
  cancellationReason?: string | null;
  appointmentDate: string;
  appointmentTime: string;
  scheduledTime?: string | null;
  estimatedTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  consultationFee: number;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  rescheduledToId?: string | null;
  patient: AdminAppointmentPatient;
  doctor: AdminAppointmentDoctor;
  rescheduleRequest?: {
    id: string;
    status: RescheduleRequestStatus;
    reason?: string | null;
    requestedDate?: string | null;
    rejectionReason?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: {
      id: string;
      name: string;
    } | null;
    createdAt: string;
  } | null;
  rescheduledTo?: {
    id: string;
    queueNumber: number;
    status: AppointmentStatus;
    appointmentDate: string;
    scheduledTime?: string | null;
  } | null;
  rescheduledFrom?: {
    id: string;
    queueNumber: number;
    status: AppointmentStatus;
    appointmentDate: string;
    scheduledTime?: string | null;
  } | null;
  audits?: AppointmentAuditEntry[];
}

export interface AdminAppointmentStats {
  todayAppointments: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  noShows: number;
  cancelled: number;
  pendingReschedules: number;
}

export interface RescheduleRequestDTO {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  reason?: string | null;
  requestedDate?: string | null;
  status: RescheduleRequestStatus;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  patient: {
    id: string;
    patientId: string;
    fullName: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    fullName: string;
    department: string;
    consultationFee: number;
  };
  originalAppointment: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    scheduledTime?: string | null;
    queueNumber: number;
    status: AppointmentStatus;
  };
}

export interface DoctorAvailableSlot {
  time: string;
  displayTime: string;
  isAvailable: boolean;
  scheduledTimeIso: string;
}

export interface DoctorAvailableSlotsResponse {
  doctorName: string;
  department: string;
  date: string;
  dayOfWeek: string;
  isDoctorWorking: boolean;
  message?: string;
  availableSlotsCount: number;
  totalSlotsCount: number;
  slots: DoctorAvailableSlot[];
}

export interface AdminAppointmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: AppointmentStatus | 'ALL';
  doctorId?: string;
  department?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  rescheduleStatus?: RescheduleRequestStatus | 'ALL' | 'HAS_REQUEST';
  sortBy?: 'appointmentDate' | 'createdAt' | 'queueNumber';
  sortOrder?: 'asc' | 'desc';
}
