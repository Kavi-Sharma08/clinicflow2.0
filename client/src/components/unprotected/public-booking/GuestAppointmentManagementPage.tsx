import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CalendarBlankIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XCircleIcon,
  UsersThreeIcon,
  MapPinIcon,
  ArrowsClockwiseIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CopyIcon,
} from "@phosphor-icons/react";
import { guestBookingService } from "../../../services/guestBookingService";
import type { PublicAvailabilitySlot } from "../../../types/guestBooking.types";

const GuestAppointmentManagementPage = () => {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  // Modals state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<string>("");
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<PublicAvailabilitySlot | null>(null);

  // 1. Fetch Guest Appointment Details
  const {
    data: appointment,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["guest-appointment", token],
    queryFn: () => guestBookingService.getGuestAppointment(token || ""),
    enabled: Boolean(token),
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll queue updates every 30s
  });

  // 2. Fetch Availability Slots for Rescheduling
  const doctorId = appointment?.doctor?.id;
  const { data: availabilityData, isLoading: isSlotsLoading } = useQuery({
    queryKey: ["public-availability", doctorId],
    queryFn: () => guestBookingService.getDoctorPublicAvailability(doctorId || ""),
    enabled: Boolean(doctorId) && isRescheduleModalOpen,
    staleTime: 30_000,
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: () => guestBookingService.cancelGuestAppointment(token || "", cancelReason),
    onSuccess: () => {
      toast.success("Appointment successfully cancelled.");
      setIsCancelModalOpen(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["guest-appointment", token] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to cancel appointment. Please try again.";
      toast.error(msg);
    },
  });

  // Reschedule Mutation
  const rescheduleMutation = useMutation({
    mutationFn: () =>
      guestBookingService.rescheduleGuestAppointment(
        token || "",
        selectedRescheduleSlot!.availabilityId,
        selectedRescheduleDate
      ),
    onSuccess: (data) => {
      toast.success("Appointment successfully rescheduled!");
      setIsRescheduleModalOpen(false);
      setSelectedRescheduleSlot(null);
      setSelectedRescheduleDate("");
      queryClient.invalidateQueries({ queryKey: ["guest-appointment", token] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to reschedule. Please try another slot.";
      toast.error(msg);
    },
  });

  // ── Loading & Error States ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Verifying secure management link...</p>
        </div>
      </div>
    );
  }

  if (isError || !appointment) {
    const errorMsg =
      (error as any)?.response?.data?.message ||
      "Invalid, expired, or revoked management link. Please check the link from your confirmation email.";

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-slate-100 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <XCircleIcon size={32} weight="duotone" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Denied or Link Expired</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Go to ClinicFlow
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableDates = availabilityData?.dates ?? [];
  const activeDateData =
    availableDates.find((d) => d.date === selectedRescheduleDate) ?? availableDates[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200">Confirmed Booking</span>;
      case "WAITING":
        return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">Waiting in Reception</span>;
      case "IN_CONSULTATION":
        return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 animate-pulse">In Consultation</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">Completed</span>;
      case "CANCELLED":
        return <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const formattedTime = new Date(appointment.scheduledTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top bar with back to doctor & refresh */}
        <div className="flex items-center justify-between">
          <Link
            to={`/book/${appointment.doctor.slug}`}
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
          >
            ← View Dr. {appointment.doctor.fullName}'s Clinic Page
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
          >
            <ArrowsClockwiseIcon size={14} /> Refresh
          </button>
        </div>

        {/* Main Appointment Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Self-Service Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                Appointment Management
              </h1>
            </div>
            <div>{getStatusBadge(appointment.status)}</div>
          </div>

          {/* Queue & Reference Banner */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Your Queue Position</p>
              <p className="text-3xl font-black text-sky-950 mt-0.5">Queue #{appointment.queueNumber}</p>
              {appointment.status === "WAITING" && (
                <p className="text-xs text-sky-700 mt-1">
                  {appointment.patientsAhead} patient{appointment.patientsAhead === 1 ? "" : "s"} ahead of you
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white/90 p-3 border border-sky-100 text-center sm:text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Booking Reference</span>
              <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                <span className="text-sm font-mono font-bold text-slate-900 select-all">
                  {appointment.bookingReference}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(appointment.bookingReference);
                    toast.success("Reference copied!");
                  }}
                  className="text-slate-400 hover:text-slate-700 transition"
                  title="Copy Reference"
                >
                  <CopyIcon size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Details */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="font-bold text-slate-900">Doctor & Clinic</h3>
              <div className="space-y-1 text-slate-600">
                <p className="font-semibold text-slate-900 text-sm">Dr. {appointment.doctor.fullName}</p>
                <p>{appointment.doctor.department} · {appointment.doctor.specialization}</p>
                {appointment.doctor.clinicAddress && (
                  <p className="flex items-start gap-1 pt-1 text-slate-500">
                    <MapPinIcon size={14} className="shrink-0 mt-0.5 text-slate-400" />
                    {appointment.doctor.clinicAddress}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="font-bold text-slate-900">Time & Patient Details</h3>
              <div className="space-y-1 text-slate-600">
                <p className="font-semibold text-slate-900">{formattedDate}</p>
                <p className="flex items-center gap-1 text-sky-800 font-bold">
                  <ClockIcon size={14} /> {formattedTime}
                </p>
                <p className="pt-1">Patient: <strong className="text-slate-900">{appointment.guest.name}</strong></p>
                <p>Phone: {appointment.guest.phone}</p>
                <p>Email: {appointment.guest.email}</p>
              </div>
            </div>
          </div>

          {/* Cancellation Notice if Cancelled */}
          {appointment.status === "CANCELLED" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <XCircleIcon size={16} weight="fill" className="text-rose-600" />
                This appointment was cancelled.
              </p>
              {appointment.cancellationReason && (
                <p className="text-rose-800">Reason: {appointment.cancellationReason}</p>
              )}
            </div>
          )}

          {/* Action Buttons: Reschedule & Cancel */}
          {(appointment.canCancel || appointment.canReschedule) && (
            <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-end gap-3">
              {appointment.canCancel && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold transition"
                >
                  Cancel Appointment
                </button>
              )}

              {appointment.canReschedule && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRescheduleModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Reschedule Appointment
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Cancel Confirmation Modal ─────────────────────────────── */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <WarningCircleIcon size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancel Appointment?</h3>
                  <p className="text-xs text-slate-500">Queue #{appointment.queueNumber} · {appointment.bookingReference}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel this appointment with Dr. {appointment.doctor.fullName}? Your reserved time slot will be released for other waiting patients.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Schedule conflict, feeling better"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isPending || !cancelReason.trim()}
                  onClick={() => cancelMutation.mutate()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Reschedule Modal ──────────────────────────────────────── */}
        {isRescheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reschedule Appointment</h3>
                <p className="text-xs text-slate-500">
                  Select a new available date and time slot with Dr. {appointment.doctor.fullName}.
                </p>
              </div>

              {/* Current slot reminder */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Current Slot:</span> {formattedDate} at {formattedTime} (Queue #{appointment.queueNumber})
              </div>

              {/* Select Date */}
              {isSlotsLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading doctor availability...</div>
              ) : availableDates.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No upcoming open slots found for this doctor.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">1. Select New Date</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableDates.map((d) => {
                        const isSelected = (selectedRescheduleDate || activeDateData?.date) === d.date;
                        const dateObj = new Date(d.date);
                        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
                        const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

                        return (
                          <button
                            key={d.date}
                            type="button"
                            disabled={!d.hasAvailableSlots}
                            onClick={() => {
                              setSelectedRescheduleDate(d.date);
                              setSelectedRescheduleSlot(null);
                            }}
                            className={`p-2.5 rounded-xl border text-center text-xs transition ${
                              isSelected
                                ? "border-sky-600 bg-sky-50 font-bold text-sky-950"
                                : d.hasAvailableSlots
                                ? "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                : "border-slate-100 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <span className="block text-[10px] text-slate-500 uppercase">{dayName}</span>
                            <span className="font-extrabold text-sm">{monthDay}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Slot */}
                  {activeDateData && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800">2. Select Time Window</label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {activeDateData.slots.map((slot) => {
                          const isSelected = selectedRescheduleSlot?.availabilityId === slot.availabilityId;

                          return (
                            <button
                              key={slot.availabilityId}
                              type="button"
                              disabled={slot.isFullyBooked}
                              onClick={() => setSelectedRescheduleSlot(slot)}
                              className={`p-3 rounded-xl border text-left text-xs transition flex justify-between items-center ${
                                isSelected
                                  ? "border-sky-600 bg-sky-50 ring-2 ring-sky-600/20 font-bold"
                                  : slot.isFullyBooked
                                  ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <span>{slot.startTime} – {slot.endTime}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                {slot.remainingCapacity} left
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Comparison Summary */}
                  {selectedRescheduleSlot && (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs space-y-1">
                      <p className="font-bold text-sky-900">Reschedule Summary:</p>
                      <p className="text-slate-600">
                        New Date: <strong className="text-slate-900">{selectedRescheduleDate || activeDateData?.date}</strong>
                      </p>
                      <p className="text-slate-600">
                        New Window: <strong className="text-slate-900">{selectedRescheduleSlot.startTime} – {selectedRescheduleSlot.endTime}</strong>
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rescheduleMutation.isPending || !selectedRescheduleSlot}
                  onClick={() => rescheduleMutation.mutate()}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {rescheduleMutation.isPending ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-slate-400 pt-4">
          Powered by <strong className="text-slate-600">ClinicFlow</strong> · Real-Time Healthcare Queue Management
        </footer>
      </div>
    </div>
  );
};

export default GuestAppointmentManagementPage;
