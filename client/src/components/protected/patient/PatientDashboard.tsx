import type { ElementType } from "react";
import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  FirstAidKitIcon,
  StethoscopeIcon,
  UserCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import { usePatientDashboard } from "../../../hooks/usePatientPortal";
import Badge from "../../common/Badge";

const KpiCard = ({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ElementType;
}) => (
  <div className="cf-card p-4 transition hover:border-slate-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
        <Icon size={20} weight="duotone" />
      </div>
    </div>
    <p className="mt-2 text-xs text-slate-500">{helper}</p>
  </div>
);

const PatientDashboard = () => {
  const { user } = useUser();
  const dashboardQuery = usePatientDashboard();
  const data = dashboardQuery.data;

  return (
    <div className="space-y-5">
      {/* ─── Header Banner ────────────────────────────────────────────── */}
      <section className="cf-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Welcome, {user?.fullName?.split(" ")[0] ?? "Patient"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-bold text-sky-700">
                Patient Workspace
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Manage your healthcare visits, check live queue positions, and book verified doctors.
            </p>
          </div>
          <Link
            to={`/patient/dashboard/${user?.id}/book`}
            className="cf-btn-primary text-xs font-bold shrink-0 self-start sm:self-auto"
          >
            <StethoscopeIcon size={16} weight="bold" /> Book Consultation
          </Link>
        </div>
      </section>

      {/* ─── KPI Metric Cards ─────────────────────────────────────────── */}
      {dashboardQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            label="Upcoming Visits"
            value={data?.upcomingCount ?? 0}
            helper="Active bookings in live queue"
            icon={ClockIcon}
          />
          <KpiCard
            label="Completed Visits"
            value={data?.completedCount ?? 0}
            helper="Past completed consultations"
            icon={CheckCircleIcon}
          />
          <KpiCard
            label="Cancelled Visits"
            value={data?.cancelledCount ?? 0}
            helper="Cancelled appointments"
            icon={CalendarCheckIcon}
          />
        </div>
      )}

      {/* ─── Two Column Layout: Next Visit Callout & Profile Readiness ─── */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Next Appointment Card */}
        <section className="cf-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <FirstAidKitIcon size={18} className="text-sky-600" weight="duotone" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Next Appointment
              </h2>
            </div>
            <Link
              to={`/patient/dashboard/${user?.id}/appointments`}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View all <ArrowRightIcon size={12} />
            </Link>
          </div>

          <div className="p-5">
            {data?.nextAppointment ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Dr. {data.nextAppointment.doctor.fullName}
                      </h3>
                      <Badge variant="booked" size="sm">
                        Queue #{data.nextAppointment.queueNumber}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {data.nextAppointment.doctor.specialization ?? data.nextAppointment.doctor.specializations?.[0] ?? "Consultation"}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <CalendarCheckIcon size={14} className="text-slate-400" />
                        {new Date(data.nextAppointment.appointmentDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/patient/dashboard/${user?.id}/appointments`}
                    className="cf-btn-secondary text-xs self-start sm:self-auto"
                  >
                    Track in Live Queue
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-xs font-semibold text-slate-700">No appointments scheduled</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Book a verified doctor to schedule your consultation and join the live queue.
                </p>
                <Link
                  to={`/patient/dashboard/${user?.id}/book`}
                  className="mt-3 inline-flex cf-btn-primary text-xs"
                >
                  Find Doctors
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Profile Readiness Panel */}
        <section className="cf-card p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCircleIcon size={18} className="text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Medical Profile
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Identifier</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{data?.patientId ?? "Not assigned"}</p>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              Keep your emergency contact, allergies, and blood group updated for faster doctor check-in.
            </p>

            <Link
              to={`/patient/dashboard/${user?.id}/profile`}
              className="cf-btn-secondary w-full text-xs font-semibold"
            >
              Update Medical Profile
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PatientDashboard;

