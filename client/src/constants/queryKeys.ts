export const QUERY_KEYS = {
  adminDashboardSummary: ["admin", "dashboard", "summary"] as const,
  adminDoctorSummary: ["admin", "doctors", "summary"] as const,
  adminDoctors: (filters: Record<string, unknown>) => ["admin", "doctors", filters] as const,
  adminDoctorDetail: (doctorUserId: string) => ["admin", "doctor", doctorUserId] as const,
  adminUsers: "admin-users",
  userStats: "user-stats",
} as const;
