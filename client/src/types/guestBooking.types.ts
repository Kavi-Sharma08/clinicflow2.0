export interface PublicDoctorScheduleSlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  consultationDuration: number;
}

export interface PublicDoctorProfileDTO {
  doctorId: string;
  slug: string;
  fullName: string;
  department: string;
  designation: string;
  specializations: string[];
  specialization: string;
  biography: string | null;
  consultationFee: number;
  profileImage: string | null;
  clinicAddress: string | null;
  hasAvailabilityConfigured: boolean;
  scheduleSummary: PublicDoctorScheduleSlot[];
  walkIn: {
    isAvailableToday: boolean;
    todayCapacityRemaining: number;
    currentWaitingCount: number;
    consultationDuration: number;
    estimatedWaitMinutes: number;
  };
}

export interface PublicAvailabilitySlot {
  availabilityId: string;
  startTime: string;
  endTime: string;
  consultationDuration: number;
  maxAppointments: number;
  bookedCount: number;
  remainingCapacity: number;
  isFullyBooked: boolean;
}

export interface PublicAvailabilityDate {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  hasAvailableSlots: boolean;
  slots: PublicAvailabilitySlot[];
}

export interface PublicDoctorAvailabilityDTO {
  doctorId: string;
  doctorSlug: string;
  dates: PublicAvailabilityDate[];
}

export interface CreateGuestBookingPayload {
  doctorIdentifier: string;
  availabilityId: string;
  appointmentDate: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  notes?: string;
}

export interface JoinWalkInQueuePayload {
  doctorIdentifier: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  notes?: string;
}

export interface GuestBookingConfirmationDTO {
  appointmentId: string;
  bookingReference: string;
  queueNumber: number;
  status: string;
  appointmentDate: string;
  scheduledTime?: string;
  consultationFee: number;
  doctor: {
    id: string;
    name: string;
    department: string;
    specialization: string;
  };
  guest: {
    name: string;
    phone: string;
    email: string;
  };
  managementToken: string;
  managementUrl: string;
  emailSent: boolean;
}

export interface GuestWalkInConfirmationDTO {
  appointmentId: string;
  bookingReference: string;
  queueNumber: number;
  status: string;
  positionInLine: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  appointmentDate: string;
  doctor: {
    id: string;
    name: string;
    department: string;
  };
  guest: {
    name: string;
    phone: string;
    email: string;
  };
  managementToken: string;
  managementUrl: string;
  emailSent: boolean;
}

export interface GuestAppointmentDetailsDTO {
  appointmentId: string;
  bookingReference: string;
  queueNumber: number;
  status: string;
  isGuest: boolean;
  isWalkIn: boolean;
  notes: string | null;
  cancellationReason: string | null;
  appointmentDate: string;
  appointmentTime: string;
  scheduledTime: string;
  estimatedTime: string | null;
  consultationFee: number;
  patientsAhead: number;
  currentServingQueueNumber: number | null;
  canCancel: boolean;
  canReschedule: boolean;
  doctor: {
    id: string;
    slug: string;
    fullName: string;
    department: string;
    specialization: string;
    clinicAddress: string | null;
    profileImage: string | null;
  };
  guest: {
    name: string;
    phone: string;
    email: string;
  };
}
