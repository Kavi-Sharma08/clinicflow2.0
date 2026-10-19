import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CalendarBlankIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  UsersThreeIcon,
  CurrencyInrIcon,
  MapPinIcon,
  CopyIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  UserIcon,
  FileTextIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { guestBookingService } from "../../../services/guestBookingService";
import type {
  CreateGuestBookingPayload,
  GuestBookingConfirmationDTO,
  GuestWalkInConfirmationDTO,
  JoinWalkInQueuePayload,
  PublicAvailabilitySlot,
} from "../../../types/guestBooking.types";

const PublicGuestBookingPage = () => {
  const { identifier } = useParams<{ identifier: string }>();

  // Tabs: 'schedule' (future appointment) vs 'walkin' (today's queue)
  const [activeTab, setActiveTab] = useState<"schedule" | "walkin">("schedule");

  // Scheduling State
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);

  // Patient Input Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  // Confirmation States
  const [scheduledResult, setScheduledResult] = useState<GuestBookingConfirmationDTO | null>(null);
  const [walkInResult, setWalkInResult] = useState<GuestWalkInConfirmationDTO | null>(null);

  // 1. Fetch Doctor Public Profile
  const {
    data: doctor,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ["public-doctor", identifier],
    queryFn: () => guestBookingService.getDoctorPublicProfile(identifier || ""),
    enabled: Boolean(identifier),
    staleTime: 60_000,
  });

  // 2. Fetch Availability Slots
  const {
    data: availability,
    isLoading: isSlotsLoading,
  } = useQuery({
    queryKey: ["public-availability", identifier],
    queryFn: () => guestBookingService.getDoctorPublicAvailability(identifier || ""),
    enabled: Boolean(identifier),
    staleTime: 30_000,
  });

  // Automatically select the first available date if none selected
  const availableDates = availability?.dates ?? [];
  const activeDateData = availableDates.find((d) => d.date === selectedDate) ?? availableDates[0];

  // Scheduled Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: (payload: CreateGuestBookingPayload) => guestBookingService.createGuestBooking(payload),
    onSuccess: (data) => {
      setScheduledResult(data);
      toast.success("Appointment successfully confirmed!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to book appointment. Please try again.";
      toast.error(msg);
    },
  });

  // Walk-in Queue Join Mutation
  const walkInMutation = useMutation({
    mutationFn: (payload: JoinWalkInQueuePayload) => guestBookingService.joinWalkInQueue(payload),
    onSuccess: (data) => {
      setWalkInResult(data);
      toast.success("You have joined today's queue!");
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to join walk-in queue. Please try again.";
      toast.error(msg);
    },
  });

  const handleScheduledSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !selectedSlot || !selectedDate) {
      toast.error("Please choose an appointment date and time slot.");
      return;
    }
    if (!patientName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!patientPhone.trim() || patientPhone.replace(/\D/g, "").length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits).");
      return;
    }
    if (!patientEmail.trim() || !patientEmail.includes("@")) {
      toast.error("Please enter a valid email address for your confirmation & management link.");
      return;
    }

    bookingMutation.mutate({
      doctorIdentifier: identifier,
      availabilityId: selectedSlot.availabilityId,
      appointmentDate: selectedDate || activeDateData?.date || "",
      guestName: patientName.trim(),
      guestPhone: patientPhone.trim(),
      guestEmail: patientEmail.trim(),
      notes: visitNotes.trim() || undefined,
    });
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    if (!patientName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!patientPhone.trim() || patientPhone.replace(/\D/g, "").length < 8) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!patientEmail.trim() || !patientEmail.includes("@")) {
      toast.error("Please enter a valid email address for queue updates.");
      return;
    }

    walkInMutation.mutate({
      doctorIdentifier: identifier,
      guestName: patientName.trim(),
      guestPhone: patientPhone.trim(),
      guestEmail: patientEmail.trim(),
      notes: visitNotes.trim() || undefined,
    });
  };

  // ── Loading & Error States ──────────────────────────────────────────
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Loading clinic schedule...</p>
        </div>
      </div>
    );
  }

  if (isProfileError || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <WarningCircleIcon size={32} weight="duotone" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Clinic Profile Unavailable</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            The doctor profile or booking link you scanned is currently unavailable or pending verification. Please verify the link or check at reception.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Go to ClinicFlow Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Success State: Scheduled Booking ────────────────────────────────
  if (scheduledResult) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-xl border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
              <CheckCircleIcon size={36} weight="fill" />
            </div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Booking Confirmed
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              You're Booked!
            </h1>
            <p className="text-xs text-slate-500">
              Appointment reserved with Dr. {doctor.fullName}
            </p>
          </div>

          {/* Reference Card */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5 text-center space-y-2">
            <p className="text-xs text-sky-800 font-medium">Your Booking Reference</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-mono font-black tracking-wider text-sky-950 select-all">
                {scheduledResult.bookingReference}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(scheduledResult.bookingReference);
                  toast.success("Reference copied!");
                }}
                className="rounded-lg bg-white p-1.5 text-sky-700 shadow-sm border border-sky-200 hover:bg-sky-50 transition"
                title="Copy reference"
              >
                <CopyIcon size={16} />
              </button>
            </div>
            <p className="text-[11px] text-sky-700">
              Queue token #{scheduledResult.queueNumber} assigned for {new Date(scheduledResult.appointmentDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
            </p>
          </div>

          {/* Summary Details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 divide-y divide-slate-200/60 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{scheduledResult.guest.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-semibold text-slate-900">Dr. {doctor.fullName} ({doctor.department})</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Queue Number:</span>
              <span className="font-bold text-sky-700">#{scheduledResult.queueNumber}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Consultation Fee:</span>
              <span className="font-semibold text-slate-900">₹{scheduledResult.consultationFee}</span>
            </div>
            {doctor.clinicAddress && (
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Location:</span>
                <span className="font-medium text-slate-700 text-right max-w-[200px]">{doctor.clinicAddress}</span>
              </div>
            )}
          </div>

          {/* Email Notice */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start gap-3">
            <EnvelopeSimpleIcon size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              {scheduledResult.emailSent ? (
                <p>
                  A confirmation email with your self-service management link was sent to <strong className="text-slate-900">{scheduledResult.guest.email}</strong>.
                </p>
              ) : (
                <p>
                  Your appointment is safely registered. Email delivery was not completed, but you can save or bookmark your management link below.
                </p>
              )}
            </div>
          </div>

          {/* Management Link Action */}
          <div className="space-y-3 pt-2">
            <a
              href={scheduledResult.managementUrl}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-md hover:bg-sky-700 transition"
            >
              Open Appointment Management <ArrowRightIcon size={16} />
            </a>
            <button
              type="button"
              onClick={() => {
                setScheduledResult(null);
                setSelectedSlot(null);
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Book another appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success State: Walk-in Queue Joined ──────────────────────────────
  if (walkInResult) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-xl border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100">
              <UsersThreeIcon size={36} weight="fill" />
            </div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
              Walk-in Queue Joined
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              You Are in Queue!
            </h1>
            <p className="text-xs text-slate-500">
              Dr. {doctor.fullName} · {doctor.department}
            </p>
          </div>

          {/* Ticket Display */}
          <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-6 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Your Queue Number</p>
            <div className="text-5xl font-black tracking-tight text-amber-950">
              #{walkInResult.queueNumber}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200">
              <span>{walkInResult.patientsAhead} patient{walkInResult.patientsAhead === 1 ? "" : "s"} ahead of you</span>
              <span>·</span>
              <span className="text-emerald-700">~{walkInResult.estimatedWaitMinutes} mins wait</span>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 divide-y divide-slate-200/60 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-900">{walkInResult.guest.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono font-semibold text-slate-900">{walkInResult.bookingReference}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-amber-700">Waiting in Reception</span>
            </div>
          </div>

          {/* Live Instructions */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-900 space-y-1">
            <p className="font-bold">Next Steps:</p>
            <p className="text-sky-800 leading-relaxed">
              Please wait comfortably in the clinic waiting area. When Queue #{walkInResult.queueNumber} is called, please enter the doctor's consultation room.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={walkInResult.managementUrl}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-md hover:bg-sky-700 transition"
            >
              View Live Queue Status <ArrowRightIcon size={16} />
            </a>
            <button
              type="button"
              onClick={() => setWalkInResult(null)}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Booking & Walk-in Form View ────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Clinic & Doctor Hero Card */}
        <header className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sky-50 text-sky-800 text-2xl font-bold flex items-center justify-center border border-sky-100 shadow-sm">
              {doctor.profileImage ? (
                <img src={doctor.profileImage} alt={doctor.fullName} className="h-full w-full object-cover" />
              ) : (
                doctor.fullName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dr. {doctor.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                  <ShieldCheckIcon size={14} weight="bold" /> Verified Doctor
                </span>
              </div>

              <p className="text-xs font-semibold text-sky-800">
                {doctor.designation} · {doctor.department}
              </p>

              {doctor.specializations?.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  Specialties: {doctor.specializations.join(", ")}
                </p>
              )}

              {doctor.clinicAddress && (
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1 pt-1">
                  <MapPinIcon size={14} className="text-slate-400 shrink-0" />
                  {doctor.clinicAddress}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-center sm:text-right border border-slate-100 min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee</span>
              <p className="text-lg font-black text-slate-900 flex items-center justify-center sm:justify-end">
                <CurrencyInrIcon size={18} weight="bold" />
                {doctor.consultationFee}
              </p>
            </div>
          </div>
        </header>

        {/* Action Mode Switcher: Book vs Today's Walk-in Queue */}
        <div className="rounded-2xl bg-slate-200/60 p-1 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "schedule"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarBlankIcon size={16} weight="bold" />
            Schedule Appointment
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("walkin")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "walkin"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UsersThreeIcon size={16} weight="bold" />
            Join Today's Queue
            {doctor.walkIn.isAvailableToday && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* ─── TAB 1: Scheduled Future Booking ────────────────────────── */}
        {activeTab === "schedule" && (
          <form onSubmit={handleScheduledSubmit} className="space-y-6">
            {/* Step 1: Date Selection */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900">Select Consultation Date</h2>
              </div>

              {availableDates.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No upcoming availability configured for this doctor. Please check back later.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {availableDates.map((d) => {
                    const isSelected = (selectedDate || activeDateData?.date) === d.date;
                    const dateObj = new Date(d.date);
                    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
                    const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d.date);
                          setSelectedSlot(null); // reset slot selection on date change
                        }}
                        disabled={!d.hasAvailableSlots}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs transition relative ${
                          isSelected
                            ? "border-sky-600 bg-sky-50/80 text-sky-950 font-bold shadow-sm"
                            : d.hasAvailableSlots
                            ? "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                            : "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-semibold text-slate-500">{dayName}</span>
                        <span className="text-sm font-extrabold mt-0.5">{monthDay}</span>
                        {d.hasAvailableSlots ? (
                          <span className="mt-1 text-[9px] font-semibold text-emerald-600">Available</span>
                        ) : (
                          <span className="mt-1 text-[9px] text-slate-400">Full</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 2: Time Window / Slot Selection */}
            {activeDateData && (
              <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">Choose Consultation Window</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {activeDateData.slots.map((slot) => {
                    const isSelected = selectedSlot?.availabilityId === slot.availabilityId;

                    return (
                      <button
                        key={slot.availabilityId}
                        type="button"
                        disabled={slot.isFullyBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? "border-sky-600 bg-sky-50/80 ring-2 ring-sky-600/20"
                            : slot.isFullyBooked
                            ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                            <ClockIcon size={16} className="text-sky-600" />
                            {slot.startTime} – {slot.endTime}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            ~{slot.consultationDuration} mins per consultation
                          </p>
                        </div>

                        <div className="text-right">
                          {slot.isFullyBooked ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                              Fully Booked
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              {slot.remainingCapacity} seat{slot.remainingCapacity === 1 ? "" : "s"} left
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Step 3: Patient Information Form */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Patient Information</h2>
                  <p className="text-[11px] text-slate-500">No account required. Your email will be used for confirmation & self-service links.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <PhoneIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeSimpleIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. patient@gmail.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Reason for Visit <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileTextIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      placeholder="Brief description of symptoms or consultation reason"
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition resize-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Bar */}
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Consultation Fee</p>
                <p className="text-xl font-black text-slate-900">₹{doctor.consultationFee}</p>
              </div>

              <button
                type="submit"
                disabled={bookingMutation.isPending || !selectedSlot}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-8 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-sky-700 transition disabled:opacity-50"
              >
                {bookingMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Confirming Reservation...
                  </>
                ) : (
                  <>
                    <SparkleIcon size={16} weight="fill" />
                    Confirm & Reserve Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ─── TAB 2: Walk-in Queue Today ─────────────────────────────── */}
        {activeTab === "walkin" && (
          <form onSubmit={handleWalkInSubmit} className="space-y-6">
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Join Today's Walk-in Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arrived at the clinic without an appointment? Take a digital queue token right now.
                </p>
              </div>

              {/* Status Banner */}
              {doctor.walkIn.isAvailableToday ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircleIcon size={18} weight="fill" className="text-emerald-600" />
                    Walk-in queue is open today!
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Patients Waiting</span>
                      <p className="text-lg font-black text-slate-900">{doctor.walkIn.currentWaitingCount}</p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Est. Wait Time</span>
                      <p className="text-lg font-black text-slate-900">~{doctor.walkIn.estimatedWaitMinutes} mins</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <WarningCircleIcon size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">Walk-in Queue is Not Available Today</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Dr. {doctor.fullName} is either not seeing patients today or has filled today's maximum walk-in limit. Please select "Schedule Appointment" above to book an upcoming available date.
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Fields */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunita Devi"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <PhoneIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeSimpleIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. sunita@gmail.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Visit Reason <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of urgent symptoms"
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={walkInMutation.isPending || !doctor.walkIn.isAvailableToday}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-sky-700 transition disabled:opacity-50"
              >
                {walkInMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Joining Today's Queue...
                  </>
                ) : (
                  <>
                    <UsersThreeIcon size={18} weight="bold" />
                    Take Queue Token
                  </>
                )}
              </button>
            </section>
          </form>
        )}

        {/* Footer info */}
        <footer className="text-center text-xs text-slate-400 pt-4">
          Powered by <strong className="text-slate-600">ClinicFlow</strong> · Real-Time Healthcare Queue Management
        </footer>
      </div>
    </div>
  );
};

export default PublicGuestBookingPage;
