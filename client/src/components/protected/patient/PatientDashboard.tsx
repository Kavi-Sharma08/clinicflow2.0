import type { ElementType } from "react";
import { CalendarCheckIcon, CheckCircleIcon, ClockIcon, FirstAidKitIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import { usePatientDashboard } from "../../../hooks/usePatientPortal";

const KpiCard = ({ label, value, icon: Icon, helper }: { label: string; value: string | number; helper: string; icon: ElementType }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
    <div className="flex items-center justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={22} weight="duotone" />
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Live</span>
    </div>
    <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
    <p className="mt-1 text-xs text-slate-500">{helper}</p>
  </div>
);

const PatientDashboard = () => {
  const { user } = useUser();
  const dashboardQuery = usePatientDashboard();
  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Patient Portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome back, {user?.fullName ?? "Patient"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Book verified doctors, track your queue, manage upcoming visits, and keep your medical profile ready for smoother consultations.</p>
        </div>
        <Link to={`/patient/dashboard/${user?.id}/book`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
          Book Appointment
        </Link>
      </section>

      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-slate-200" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard label="Upcoming visits" value={data?.upcomingCount ?? 0} helper="Booked consultations waiting in queue" icon={ClockIcon} />
          <KpiCard label="Completed visits" value={data?.completedCount ?? 0} helper="Total consultations completed" icon={CheckCircleIcon} />
          <KpiCard label="Cancelled visits" value={data?.cancelledCount ?? 0} helper="Appointments cancelled so far" icon={CalendarCheckIcon} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Next appointment</h2>
              <p className="mt-1 text-sm text-slate-500">Live queue information updates when your appointment changes.</p>
            </div>
            <FirstAidKitIcon size={28} className="text-blue-600" weight="duotone" />
          </div>
          {data?.nextAppointment ? (
            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold text-slate-950">Dr. {data.nextAppointment.doctor.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{data.nextAppointment.doctor.specialization ?? data.nextAppointment.doctor.specializations?.[0] ?? "General consultation"}</p>
                  <p className="mt-3 text-sm text-slate-600">{new Date(data.nextAppointment.appointmentDate).toLocaleDateString()} · Queue #{data.nextAppointment.queueNumber}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700">{data.nextAppointment.status}</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm font-semibold text-slate-950">No appointment booked</p>
              <p className="mt-1 text-sm text-slate-500">Find a verified doctor and reserve a queue slot.</p>
              <Link to={`/patient/dashboard/${user?.id}/book`} className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Find doctors</Link>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm shadow-slate-950/[0.06]">
          <h2 className="text-lg font-bold">Profile readiness</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Keep allergies, chronic conditions, and emergency contacts updated before booking appointments.</p>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Patient ID</p>
            <p className="mt-2 text-xl font-bold">{data?.patientId ?? "Complete profile"}</p>
          </div>
          <Link to={`/patient/dashboard/${user?.id}/profile`} className="mt-5 inline-flex h-10 items-center rounded-2xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-100">Update profile</Link>
        </section>
      </div>
    </div>
  );
};

export default PatientDashboard;
