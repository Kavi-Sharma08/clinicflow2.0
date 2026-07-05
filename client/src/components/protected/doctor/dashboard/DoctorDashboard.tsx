import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyInrIcon,
  StethoscopeIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useDoctorDashboardSummary } from "../../../../hooks/useDoctorPortal";
import { EmptyState, MetricCard, SectionCard, SkeletonBlock, StatusBadge, formatCurrency, formatDateTime } from "../shared/DoctorPortalAtoms";

const DoctorDashboard = () => {
  const { data, isLoading, isError } = useDoctorDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-36" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-36" />)}
        </div>
        <SkeletonBlock className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Doctor workspace unavailable" description="Your doctor profile may still be pending. Complete verification first, then return here." />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative p-6">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900" />
          <div className="relative flex flex-col gap-5 pt-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-700 shadow-sm">
                {data.doctor.profileImage ? <img src={data.doctor.profileImage} alt={data.doctor.fullName} className="h-full w-full object-cover" /> : data.doctor.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Welcome back, {data.doctor.fullName}</h1>
                  <StatusBadge status={data.doctor.verificationStatus} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {data.doctor.designation ?? "Doctor"} · {data.doctor.department} · {data.doctor.specializations.join(", ")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="availability" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Manage availability
              </Link>
              <Link to="appointments" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700">
                View queue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Today’s appointments" value={data.metrics.todayAppointments} description="Booked for today" icon={<CalendarCheckIcon size={24} weight="duotone" />} />
        <MetricCard label="Completed" value={data.metrics.completedToday} description="Closed today" icon={<CheckCircleIcon size={24} weight="duotone" />} />
        <MetricCard label="Cancelled" value={data.metrics.cancelledToday} description="Cancelled today" icon={<ClockIcon size={24} weight="duotone" />} />
        <MetricCard label="Active slots" value={data.metrics.activeSlots} description="Availability windows" icon={<StethoscopeIcon size={24} weight="duotone" />} />
        <MetricCard label="Consultation fee" value={formatCurrency(data.doctor.consultationFee)} description="Current configured fee" icon={<CurrencyInrIcon size={24} weight="duotone" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Upcoming patient queue" description="Live queue view for booked appointments." action={<Link to="appointments" className="text-sm font-semibold text-blue-600">View all</Link>}>
          {data.upcomingAppointments.length === 0 ? (
            <EmptyState title="No upcoming bookings" description="New bookings will appear here as patients schedule appointments." />
          ) : (
            <div className="space-y-3">
              {data.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">#{appointment.queueNumber}</div>
                    <div>
                      <p className="font-semibold text-slate-950">{appointment.patient.fullName}</p>
                      <p className="text-sm text-slate-500">{formatDateTime(appointment.appointmentTime)}</p>
                    </div>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Today’s operating focus" description="Keep the daily workflow tight and predictable.">
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-900">
              <div className="flex items-center gap-2 font-semibold"><UsersThreeIcon size={20} /> Queue discipline</div>
              <p className="mt-2 text-sm text-blue-800">Review booked patients before the slot begins and update statuses immediately after consultation.</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
              <div className="flex items-center gap-2 font-semibold"><CheckCircleIcon size={20} /> Availability hygiene</div>
              <p className="mt-2 text-sm text-emerald-800">Keep weekly slots accurate so patients only see valid booking windows.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default DoctorDashboard;
