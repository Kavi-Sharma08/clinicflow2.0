import { useState, useMemo } from "react";
import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { useCancelPatientAppointment, usePatientAppointments } from "../../../hooks/usePatientPortal";
import type { PatientAppointment } from "../../../types/patientPortal.types";
import AppointmentQueueCard from "./AppointmentQueueCard";
import Badge from "../../common/Badge";

type AppointmentTab = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";

const TABS: { label: string; value: AppointmentTab }[] = [
  { label: "All Visits", value: "ALL" },
  { label: "Upcoming / Waiting", value: "UPCOMING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const MyAppointments = () => {
  const appointmentsQuery = usePatientAppointments();
  const cancelMutation = useCancelPatientAppointment();
  const [activeTab, setActiveTab] = useState<AppointmentTab>("ALL");
  const [pendingCancel, setPendingCancel] = useState<PatientAppointment | null>(null);
  const [reason, setReason] = useState("");

  const allAppointments = appointmentsQuery.data ?? [];

  const filteredAppointments = useMemo(() => {
    if (activeTab === "ALL") return allAppointments;
    if (activeTab === "UPCOMING") {
      return allAppointments.filter(
        (a) => a.status === "BOOKED" || a.status === "WAITING" || a.status === "IN_CONSULTATION"
      );
    }
    if (activeTab === "COMPLETED") {
      return allAppointments.filter((a) => a.status === "COMPLETED");
    }
    if (activeTab === "CANCELLED") {
      return allAppointments.filter((a) => a.status === "CANCELLED" || a.status === "NO_SHOW");
    }
    return allAppointments;
  }, [allAppointments, activeTab]);

  const confirmCancel = () => {
    if (!pendingCancel) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancelling");
      return;
    }
    cancelMutation.mutate(
      { id: pendingCancel.id, cancellationReason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled successfully");
          setPendingCancel(null);
          setReason("");
        },
        onError: () => toast.error("Unable to cancel appointment"),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Status Filter Tabs */}
      <section className="cf-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">My Appointments</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Track your scheduled consultations, live queue numbers, and consultation history.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {TABS.map((tab) => {
            const count =
              tab.value === "ALL"
                ? allAppointments.length
                : tab.value === "UPCOMING"
                ? allAppointments.filter((a) => a.status === "BOOKED" || a.status === "WAITING" || a.status === "IN_CONSULTATION").length
                : tab.value === "COMPLETED"
                ? allAppointments.filter((a) => a.status === "COMPLETED").length
                : allAppointments.filter((a) => a.status === "CANCELLED" || a.status === "NO_SHOW").length;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.value
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    activeTab === tab.value ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Appointments List */}
      {appointmentsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      )}

      {!appointmentsQuery.isLoading && filteredAppointments.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <CalendarCheckIcon size={36} className="mx-auto text-slate-300 mb-2" weight="duotone" />
          <p className="text-sm font-bold text-slate-900">No appointments found</p>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === "ALL"
              ? "You have not booked any appointments yet."
              : `No appointments in the "${activeTab.toLowerCase()}" category.`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredAppointments.map((appointment) => (
          <AppointmentQueueCard
            key={appointment.id}
            appointment={appointment}
            onCancel={setPendingCancel}
          />
        ))}
      </div>

      {/* Cancellation Confirmation Modal */}
      {pendingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Cancel Appointment?</h2>
            <p className="mt-1 text-xs text-slate-500">
              Dr. {pendingCancel.doctor.fullName} · Queue #{pendingCancel.queueNumber} · {new Date(pendingCancel.appointmentDate).toLocaleDateString()}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Cancellation Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Let the clinic know why you are cancelling..."
                className="cf-textarea text-xs"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingCancel(null);
                  setReason("");
                }}
                className="cf-btn-secondary text-xs"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling…" : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;

