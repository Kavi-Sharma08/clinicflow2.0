import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyInrIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  StethoscopeIcon,
  UserCheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useBookPatientAppointment,
  usePatientDoctorAvailability,
  usePatientDoctors,
  usePatientSpecializations,
} from "../../../hooks/usePatientPortal";
import type {
  AppointmentUrgency,
  PatientAvailabilitySlot,
  PatientDoctor,
} from "../../../types/patientPortal.types";
import Badge from "../../common/Badge";

const todayIso = () => new Date().toISOString().slice(0, 10);

// Helper to group slots into Morning (before 12:00), Afternoon (12:00-17:00), Evening (after 17:00)
const groupSlotsByPeriod = (slots: PatientAvailabilitySlot[]) => {
  const morning: PatientAvailabilitySlot[] = [];
  const afternoon: PatientAvailabilitySlot[] = [];
  const evening: PatientAvailabilitySlot[] = [];

  slots.forEach((slot) => {
    const hour = parseInt(slot.startTime.split(":")[0] || "0", 10);
    if (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else evening.push(slot);
  });

  return { morning, afternoon, evening };
};

const DoctorCard = ({
  doctor,
  isSelected,
  onSelect,
}: {
  doctor: PatientDoctor;
  isSelected: boolean;
  onSelect: (doctor: PatientDoctor) => void;
}) => {
  return (
    <article
      onClick={() => onSelect(doctor)}
      className={`group relative flex cursor-pointer flex-col rounded-xl border p-4 transition-all ${
        isSelected
          ? "border-sky-600 bg-sky-50/40 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-100">
          {doctor.profilePhotoUrl ? (
            <img src={doctor.profilePhotoUrl} alt={doctor.fullName} className="h-full w-full object-cover" />
          ) : (
            <StethoscopeIcon size={22} weight="duotone" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-sky-700">
                Dr. {doctor.fullName}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                {doctor.specialization ?? doctor.specializations[0] ?? "General Practice"}
              </p>
            </div>
            <Badge variant="verified" size="sm" dot>
              Verified
            </Badge>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {doctor.bio ?? `${doctor.currentAffiliation ?? "ClinicFlow"} · ${doctor.specializations.join(", ") || "General care"}`}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-0.5">
              ₹{doctor.consultationFee} <span className="text-[10px] font-normal text-slate-400">/ visit</span>
            </span>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-sky-50 group-hover:text-sky-700"
              }`}
            >
              {isSelected ? "Selected" : "Select doctor"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const BookAppointment = () => {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso());
  const [selectedDoctor, setSelectedDoctor] = useState<PatientDoctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PatientAvailabilitySlot | null>(null);
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<AppointmentUrgency>("ROUTINE");

  const doctorsQuery = usePatientDoctors({ search, specialization, date });
  const specializationsQuery = usePatientSpecializations();
  const availabilityQuery = usePatientDoctorAvailability(selectedDoctor?.doctorId ?? null);
  const bookMutation = useBookPatientAppointment(selectedDoctor?.doctorId ?? null);

  const visibleSlots = useMemo(() => {
    if (!availabilityQuery.data) return [];
    return availabilityQuery.data.filter((slot) => !date || slot.date === date);
  }, [availabilityQuery.data, date]);

  const slotGroups = useMemo(() => groupSlotsByPeriod(visibleSlots), [visibleSlots]);

  const confirmBooking = () => {
    if (!selectedSlot) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for the consultation");
      return;
    }
    bookMutation.mutate(
      {
        availabilityId: selectedSlot.availabilityId,
        appointmentDate: selectedSlot.date,
        notes: reason.trim(),
        urgency,
      },
      {
        onSuccess: (appointment) => {
          toast.success(`Booked successfully! Your Queue number is #${appointment.queueNumber}`);
          setSelectedSlot(null);
          setReason("");
        },
        onError: () => toast.error("Unable to book this appointment. The slot may be full."),
      },
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSpecialization(null);
    setDate(todayIso());
  };

  const hasFilters = Boolean(search || specialization || date !== todayIso());
  const doctors = doctorsQuery.data ?? [];

  return (
    <div className="space-y-5">
      {/* ─── Search & Filter Bar ────────────────────────────────────────── */}
      <section className="cf-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors by name, department, specialization..."
              className="cf-input pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={specialization ?? ""}
              onChange={(e) => setSpecialization(e.target.value || null)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">All Specializations</option>
              {specializationsQuery.data?.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="cf-btn-ghost text-xs"
              >
                <XIcon size={12} weight="bold" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <span>
            {doctorsQuery.isLoading
              ? "Searching verified doctors…"
              : `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} available`}
          </span>
          {date && (
            <span className="font-semibold text-slate-700">
              Date: {new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </section>

      {/* ─── Main Content Grid: Doctor List + Booking Side Panel ──────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Scalable Doctor List */}
        <section className="space-y-3">
          {doctorsQuery.isLoading && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-xl bg-slate-100 border border-slate-200" />
              ))}
            </div>
          )}

          {!doctorsQuery.isLoading && doctors.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <StethoscopeIcon size={36} className="mx-auto text-slate-400 mb-2" weight="duotone" />
              <p className="text-sm font-bold text-slate-900">No doctors match your criteria</p>
              <p className="mt-1 text-xs text-slate-500">Try searching another specialization or changing the appointment date.</p>
              <button onClick={clearFilters} className="mt-4 cf-btn-secondary text-xs">
                Reset all filters
              </button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.doctorId}
                doctor={doctor}
                isSelected={selectedDoctor?.doctorId === doctor.doctorId}
                onSelect={(d) => {
                  setSelectedDoctor(d);
                  setSelectedSlot(null);
                }}
              />
            ))}
          </div>
        </section>

        {/* Right Column: Appointment Slot & Confirmation Panel */}
        <aside className="sticky top-20 h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Book Appointment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Select a doctor and consultation slot</p>
          </div>

          {!selectedDoctor ? (
            <div className="py-12 text-center text-slate-400">
              <UserCheckIcon size={32} className="mx-auto text-slate-300 mb-2" weight="duotone" />
              <p className="text-xs font-semibold text-slate-600">No doctor selected</p>
              <p className="mt-1 text-[11px] text-slate-400 max-w-[200px] mx-auto">
                Click on any doctor card from the list to view their live available slots.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Selected Doctor Summary Card */}
              <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">Dr. {selectedDoctor.fullName}</p>
                    <p className="text-[11px] text-slate-500">{selectedDoctor.specialization ?? selectedDoctor.specializations[0] ?? "Consultation"}</p>
                  </div>
                  <span className="text-xs font-bold text-sky-700">₹{selectedDoctor.consultationFee}</span>
                </div>
              </div>

              {/* Slot Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Available Slots ({new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })})
                </label>

                {availabilityQuery.isLoading && (
                  <div className="space-y-2 py-2">
                    <div className="h-10 rounded-lg shimmer" />
                    <div className="h-10 rounded-lg shimmer" />
                  </div>
                )}

                {!availabilityQuery.isLoading && visibleSlots.length === 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    No open consultation slots on this date.
                  </div>
                )}

                {/* Grouped Morning, Afternoon, Evening */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {slotGroups.morning.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Morning</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {slotGroups.morning.map((slot) => {
                          const remaining = slot.maxAppointments - slot.bookedCount;
                          const isFull = remaining <= 0;
                          const isPicked = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={`${slot.id}-${slot.date}`}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              disabled={isFull}
                              className={`rounded-lg border p-2 text-left transition ${
                                isPicked
                                  ? "border-sky-600 bg-sky-600 text-white font-bold"
                                  : isFull
                                  ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed text-slate-400"
                                  : "border-slate-200 bg-white hover:border-sky-300 text-slate-800"
                              }`}
                            >
                              <div className="text-xs font-bold">{slot.startTime}</div>
                              <div className={`text-[10px] ${isPicked ? "text-sky-100" : "text-slate-500"}`}>
                                {isFull ? "Full" : `${remaining} left`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {slotGroups.afternoon.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Afternoon</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {slotGroups.afternoon.map((slot) => {
                          const remaining = slot.maxAppointments - slot.bookedCount;
                          const isFull = remaining <= 0;
                          const isPicked = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={`${slot.id}-${slot.date}`}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              disabled={isFull}
                              className={`rounded-lg border p-2 text-left transition ${
                                isPicked
                                  ? "border-sky-600 bg-sky-600 text-white font-bold"
                                  : isFull
                                  ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed text-slate-400"
                                  : "border-slate-200 bg-white hover:border-sky-300 text-slate-800"
                              }`}
                            >
                              <div className="text-xs font-bold">{slot.startTime}</div>
                              <div className={`text-[10px] ${isPicked ? "text-sky-100" : "text-slate-500"}`}>
                                {isFull ? "Full" : `${remaining} left`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {slotGroups.evening.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Evening</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {slotGroups.evening.map((slot) => {
                          const remaining = slot.maxAppointments - slot.bookedCount;
                          const isFull = remaining <= 0;
                          const isPicked = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={`${slot.id}-${slot.date}`}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              disabled={isFull}
                              className={`rounded-lg border p-2 text-left transition ${
                                isPicked
                                  ? "border-sky-600 bg-sky-600 text-white font-bold"
                                  : isFull
                                  ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed text-slate-400"
                                  : "border-slate-200 bg-white hover:border-sky-300 text-slate-800"
                              }`}
                            >
                              <div className="text-xs font-bold">{slot.startTime}</div>
                              <div className={`text-[10px] ${isPicked ? "text-sky-100" : "text-slate-500"}`}>
                                {isFull ? "Full" : `${remaining} left`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Urgency & Reason for Visit */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Visit Priority
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as AppointmentUrgency)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="ROUTINE">Routine Consultation</option>
                    <option value="URGENT">Urgent Care (Priority Queue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Symptoms / Reason for visit
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    className="cf-textarea text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={!selectedSlot || bookMutation.isPending}
                  className="cf-btn-primary w-full text-xs font-bold"
                >
                  {bookMutation.isPending ? "Reserving slot…" : "Confirm Booking & Reserve Queue #"}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default BookAppointment;

