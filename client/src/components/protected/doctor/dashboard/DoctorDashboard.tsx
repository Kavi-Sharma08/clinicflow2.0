import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyInrIcon,
  StethoscopeIcon,
  UsersThreeIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useDoctorDashboardSummary } from "../../../../hooks/useDoctorPortal";
import { EmptyState, MetricCard, SectionCard, SkeletonBlock, StatusBadge, formatCurrency, formatDateTime } from "../shared/DoctorPortalAtoms";

const DoctorDashboard = () => {
  const { data, isLoading, isError } = useDoctorDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-28" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-24" />)}
        </div>
        <SkeletonBlock className="h-72" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Doctor workspace unavailable"
        description="Your doctor profile may still be pending review or unavailable. Please complete verification first."
        action={
          <Link to="/doctor/profile" className="cf-btn-primary text-xs">
            Review Profile & Verification
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Doctor Overview Header ─────────────────────────────────────── */}
      <section className="cf-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sky-50 text-sky-800 text-base font-bold border border-sky-100">
              {data.doctor.profileImage ? (
                <img src={data.doctor.profileImage} alt={data.doctor.fullName} className="h-full w-full object-cover" />
              ) : (
                data.doctor.fullName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Dr. {data.doctor.fullName}
                </h1>
                <StatusBadge status={data.doctor.verificationStatus} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {data.doctor.designation ?? "Consulting Physician"} · {data.doctor.department} · {data.doctor.specializations.join(", ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="availability" className="cf-btn-secondary text-xs">
              Manage Availability
            </Link>
            <Link to="appointments" className="cf-btn-primary text-xs">
              Open Live Queue
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Metric KPI Bar ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Today's Bookings"
          value={data.metrics.todayAppointments}
          description="Booked patients for today"
          icon={<CalendarCheckIcon size={20} weight="duotone" />}
        />
        <MetricCard
          label="Completed Today"
          value={data.metrics.completedToday}
          description="Finished consultations"
          icon={<CheckCircleIcon size={20} weight="duotone" />}
        />
        <MetricCard
          label="Cancelled Today"
          value={data.metrics.cancelledToday}
          description="Cancelled or no-show"
          icon={<ClockIcon size={20} weight="duotone" />}
        />
        <MetricCard
          label="Active Slots"
          value={data.metrics.activeSlots}
          description="Configured availability"
          icon={<StethoscopeIcon size={20} weight="duotone" />}
        />
        <MetricCard
          label="Consultation Fee"
          value={formatCurrency(data.doctor.consultationFee)}
          description="Current slot price"
          icon={<CurrencyInrIcon size={20} weight="duotone" />}
        />
      </div>

      {/* ─── Two Column Layout: Upcoming Queue & Operations Guidance ───── */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title="Upcoming Patient Queue"
          description="Today's active consultations in queue order."
          action={
            <Link to="appointments" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View live queue <ArrowRightIcon size={12} />
            </Link>
          }
        >
          {data.upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming bookings"
              description="New patient bookings will appear here as patients book available consultation slots."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-800 border border-sky-100">
                      #{appointment.queueNumber}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{appointment.patientName}</p>
                      <p className="text-[11px] text-slate-500">{formatDateTime(appointment.appointmentTime)}</p>
                    </div>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Clinical Best Practices" description="Ensure smooth clinic queue flow.">
          <div className="space-y-3">
            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <UsersThreeIcon size={16} /> Live Queue Discipline
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-sky-800">
                Start consultations when calling the patient into your office, and click complete right away to automatically shift waiting patient ETAs.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircleIcon size={16} /> Slot Hygiene
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                Keep consultation duration updated so estimated times for waiting patients reflect realistic consultation lengths.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default DoctorDashboard;

