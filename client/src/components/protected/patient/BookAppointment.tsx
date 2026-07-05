import { MagnifyingGlassIcon, StethoscopeIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useBookPatientAppointment, usePatientDoctorAvailability, usePatientDoctors, usePatientSpecializations } from "../../../hooks/usePatientPortal";
import type { AppointmentUrgency, PatientAvailabilitySlot, PatientDoctor } from "../../../types/patientPortal.types";

const todayIso = () => new Date().toISOString().slice(0, 10);

const DoctorCard = ({ doctor, onSelect }: { doctor: PatientDoctor; onSelect: (doctor: PatientDoctor) => void }) => (
  <button onClick={() => onSelect(doctor)} className="group rounded-[2rem] border border-slate-200 bg-white p-5 text-left shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5">
    <div className="flex gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-600">
        {doctor.profilePhotoUrl ? <img src={doctor.profilePhotoUrl} alt={doctor.fullName} className="h-full w-full object-cover" /> : <StethoscopeIcon size={25} weight="duotone" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="truncate text-base font-bold text-slate-950">Dr. {doctor.fullName}</p>
            <p className="mt-1 text-sm text-slate-500">{doctor.specialization ?? doctor.specializations[0] ?? "General Physician"}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Verified</span>
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{doctor.bio ?? `${doctor.currentAffiliation ?? "ClinicFlow"} · ${doctor.specializations.join(", ") || "General care"}`}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">₹{doctor.consultationFee}</span>
          {(doctor.specializations ?? []).slice(0, 2).map((item) => <span key={item} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item}</span>)}
        </div>
      </div>
    </div>
  </button>
);

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

  const confirmBooking = () => {
    if (!selectedSlot) return;
    if (!reason.trim()) {
      toast.error("Please add a reason for visit");
      return;
    }
    bookMutation.mutate(
      { availabilityId: selectedSlot.availabilityId, appointmentDate: selectedSlot.date, notes: reason.trim(), urgency },
      {
        onSuccess: (appointment) => {
          toast.success(`Booked successfully. Queue #${appointment.queueNumber}`);
          setSelectedSlot(null);
          setReason("");
        },
        onError: () => toast.error("Unable to book this appointment. The slot may be full."),
      },
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Find care</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Book an appointment</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Search verified doctors, check live availability, and reserve your queue position.</p>
          </div>
          <input type="date" value={date} min={todayIso()} onChange={(event) => setDate(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search doctor name, department, phone..." className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </div>
          <select value={specialization ?? ""} onChange={(event) => setSpecialization(event.target.value || null)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
            <option value="">All specializations</option>
            {specializationsQuery.data?.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {doctorsQuery.isLoading && [1, 2, 3, 4].map((item) => <div key={item} className="h-56 animate-pulse rounded-[2rem] bg-slate-200" />)}
          {!doctorsQuery.isLoading && doctorsQuery.data?.length === 0 && (
            <div className="col-span-full rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-base font-bold text-slate-950">No doctors found</p>
              <p className="mt-2 text-sm text-slate-500">Try removing filters or searching another specialization.</p>
            </div>
          )}
          {doctorsQuery.data?.map((doctor) => <DoctorCard key={doctor.doctorId} doctor={doctor} onSelect={setSelectedDoctor} />)}
        </section>

        <aside className="sticky top-20 h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
          <h2 className="text-lg font-bold text-slate-950">Appointment slot</h2>
          {!selectedDoctor ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">Select a doctor to see available slots for the selected date.</p>
          ) : (
            <div className="mt-4">
              <p className="font-bold text-slate-950">Dr. {selectedDoctor.fullName}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedDoctor.specialization ?? selectedDoctor.specializations[0] ?? "General"}</p>
              <div className="mt-5 space-y-3">
                {availabilityQuery.isLoading && <p className="text-sm text-slate-500">Loading availability…</p>}
                {!availabilityQuery.isLoading && visibleSlots.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No slot is open for this date.</p>}
                {visibleSlots.map((slot) => {
                  const remaining = slot.maxAppointments - slot.bookedCount;
                  return (
                    <button key={`${slot.id}-${slot.date}`} onClick={() => setSelectedSlot(slot)} disabled={remaining <= 0} className={`w-full rounded-2xl border p-4 text-left transition ${selectedSlot?.id === slot.id ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-200"} disabled:cursor-not-allowed disabled:opacity-50`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-950">{slot.startTime} – {slot.endTime}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{remaining} left</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Queue capacity {slot.maxAppointments}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 space-y-3">
                <select value={urgency} onChange={(event) => setUrgency(event.target.value as AppointmentUrgency)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                  <option value="ROUTINE">Routine visit</option>
                  <option value="URGENT">Urgent care</option>
                </select>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Reason for visit" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                <button onClick={confirmBooking} disabled={!selectedSlot || bookMutation.isPending} className="h-11 w-full rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {bookMutation.isPending ? "Booking…" : "Confirm booking"}
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
