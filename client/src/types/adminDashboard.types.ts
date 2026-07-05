export interface AdminActivityFeedItemDTO {
  id: string;
  label: string;
  timestamp: string;
  type: string;
}

export interface AdminDashboardSummaryDTO {
  totalDoctors: number;
  pendingDoctorApprovals: number;
  totalPatients: number;
  appointmentsToday: number;
  completedAppointmentsToday: number;
  cancelledAppointmentsToday: number;
  completedAppointmentsRate: number;
  activeDoctors: number;
  activityFeed: AdminActivityFeedItemDTO[];
}
