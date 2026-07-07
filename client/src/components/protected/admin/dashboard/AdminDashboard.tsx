import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  ClockIcon,
  StethoscopeIcon,
  TrendUpIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { useUser } from "../../../../context/UserContext";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { adminDashboardService } from "../../../../services/adminDashboardService";
import { KpiCard } from "./KpiCard";

const chartData = [
  { name: "Mon", value: 8 },
  { name: "Tue", value: 14 },
  { name: "Wed", value: 10 },
  { name: "Thu", value: 18 },
  { name: "Fri", value: 16 },
  { name: "Sat", value: 20 },
  { name: "Sun", value: 12 },
];

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-32 animate-pulse rounded-2xl bg-white" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-white" />)}
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="h-80 animate-pulse rounded-2xl bg-white xl:col-span-2" />
      <div className="h-80 animate-pulse rounded-2xl bg-white" />
    </div>
  </div>
);

export function AdminDashboard() {
  const { user } = useUser();
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.adminDashboardSummary,
    queryFn: adminDashboardService.getSummary,
    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-sm text-rose-600 shadow-sm">
        Unable to load dashboard metrics. Please check the backend dashboard endpoint.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.6fr] lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">ClinicFlow command center</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Good morning, {user?.fullName?.split(" ")[0] ?? "Admin"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Monitor doctor verification, patient growth, and appointment activity from one operational dashboard.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-medium text-slate-300">Completed appointments today</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-semibold text-white">{data?.completedAppointmentsRate ?? 0}%</span>
              <span className="pb-1 text-sm text-emerald-300">system flow</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Doctors" value={String(data?.totalDoctors ?? 0)} delta="Live" sublabel="Registered doctor profiles" icon={StethoscopeIcon} accent="indigo" trend={[3, 5, 4, 8, 9, 11, 12]} />
        <KpiCard label="Pending Approvals" value={String(data?.pendingDoctorApprovals ?? 0)} delta="Review" sublabel="Doctor profiles awaiting admin" icon={ClockIcon} accent="amber" trend={[4, 4, 6, 7, 5, 9, 8]} />
        <KpiCard label="Total Patients" value={String(data?.totalPatients ?? 0)} delta="Live" sublabel="Created patient records" icon={UsersIcon} accent="emerald" trend={[10, 12, 11, 14, 16, 18, 19]} />
        <KpiCard label="Appointments Today" value={String(data?.appointmentsToday ?? 0)} delta="Today" sublabel={`${data?.completedAppointmentsToday ?? 0} completed · ${data?.cancelledAppointmentsToday ?? 0} cancelled`} icon={CalendarCheckIcon} accent="violet" trend={[5, 8, 6, 10, 12, 9, 13]} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="cf-card p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Appointments Trend</h2>
              <p className="mt-1 text-xs text-slate-500">Backend metrics are shown above; this visual is a lightweight weekly trend shell.</p>
            </div>
            <TrendUpIcon size={20} className="text-blue-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="clinicflowArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="url(#clinicflowArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cf-card p-5">
          <h2 className="text-sm font-semibold text-slate-950">Live Activity</h2>
          <div className="mt-5 space-y-4">
            {(data?.activityFeed ?? []).length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No activity recorded yet.</div>
            ) : (
              data?.activityFeed.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
