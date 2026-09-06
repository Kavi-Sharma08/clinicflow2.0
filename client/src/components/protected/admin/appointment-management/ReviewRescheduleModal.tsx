import { useState, useMemo } from 'react';
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { RescheduleRequestDTO } from '../../../../types/adminAppointment.types';
import {
  useConfirmReschedule,
  useDoctorAvailableSlots,
  useRejectReschedule,
} from '../../../../hooks/useAdminAppointments';
import Badge from '../../../common/Badge';

interface ReviewRescheduleModalProps {
  request: RescheduleRequestDTO | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewRescheduleModal = ({
  request,
  onClose,
  onSuccess,
}: ReviewRescheduleModalProps) => {
  const confirmMutation = useConfirmReschedule();
  const rejectMutation = useRejectReschedule();

  const initialDate = useMemo(() => {
    if (request?.requestedDate) {
      return request.requestedDate.slice(0, 10);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }, [request]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isConfirmStep, setIsConfirmStep] = useState(false);

  const { data: slotData, isLoading: slotsLoading } = useDoctorAvailableSlots(
    request?.doctorId,
    selectedDate
  );

  if (!request) return null;

  const handleSlotSelect = (time: string) => {
    setSelectedSlotTime(time);
    setIsConfirmStep(true);
  };

  const handleConfirm = () => {
    if (!selectedSlotTime) return;
    confirmMutation.mutate(
      {
        id: request.id,
        newDate: selectedDate,
        newTime: selectedSlotTime,
        notes: adminNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    rejectMutation.mutate(
      {
        id: request.id,
        rejectionReason: rejectionReason.trim(),
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  const originalDateFormatted = new Date(
    request.originalAppointment.appointmentDate
  ).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const selectedDateFormatted = new Date(selectedDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Reschedule Request Review
            </span>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              Review & Reschedule Appointment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Patient & Original Appointment Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Patient Details
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-sm shrink-0">
                  {request.patient.fullName[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{request.patient.fullName}</p>
                  <p className="text-[11px] text-slate-500">{request.patient.phone}</p>
                  <p className="text-[11px] text-slate-400">{request.patient.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    ID: {request.patient.patientId}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Original Appointment
              </p>
              <div>
                <p className="text-xs font-bold text-slate-900">{request.doctor.fullName}</p>
                <p className="text-[11px] text-slate-500">{request.doctor.department}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded bg-white px-2 py-0.5 font-semibold text-slate-700 border border-slate-200">
                    {originalDateFormatted}
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 font-bold text-sky-700 border border-slate-200">
                    Queue #{request.originalAppointment.queueNumber}
                  </span>
                  <Badge variant="no_show" size="sm">
                    NO SHOW
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Patient Reason for Rescheduling
            </p>
            <p className="mt-1 text-xs text-amber-950 font-medium leading-relaxed">
              "{request.reason || 'No specific reason provided by patient.'}"
            </p>
            <p className="mt-2 text-[10px] text-amber-700">
              Submitted on {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>

          {!rejecting ? (
            <>
              {/* Step 1: Select Reschedule Date */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CalendarBlankIcon size={16} className="text-slate-500" />
                    Select Target Reschedule Date
                  </label>
                  {request.requestedDate && (
                    <span className="text-[11px] text-purple-700 font-medium">
                      Patient preferred: {new Date(request.requestedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotTime(null);
                    setIsConfirmStep(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Step 2: Available Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ClockIcon size={16} className="text-slate-500" />
                    Available Consultation Slots ({selectedDateFormatted})
                  </label>
                  {slotData && (
                    <span className="text-[11px] font-bold text-emerald-700">
                      {slotData.availableSlotsCount} of {slotData.totalSlotsCount} slots available
                    </span>
                  )}
                </div>

                {slotsLoading ? (
                  <div className="grid grid-cols-4 gap-2 py-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : !slotData?.isDoctorWorking ? (
                  <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 p-6 text-center">
                    <WarningCircleIcon size={24} className="mx-auto text-rose-500 mb-1" />
                    <p className="text-xs font-bold text-rose-900">
                      Doctor Not Available on {slotData?.dayOfWeek}s
                    </p>
                    <p className="mt-0.5 text-[11px] text-rose-700">
                      {slotData?.message || 'Please choose a different date.'}
                    </p>
                  </div>
                ) : slotData.slots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    No time slots configured for this day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {slotData.slots.map((slot) => {
                      const isSelected = selectedSlotTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => handleSlotSelect(slot.time)}
                          className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white shadow-sm ring-2 ring-purple-200'
                              : slot.isAvailable
                              ? 'border-slate-200 bg-white text-slate-800 hover:border-purple-300 hover:bg-purple-50/50'
                              : 'border-slate-100 bg-slate-100/60 text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          <span>{slot.displayTime}</span>
                          <span
                            className={`text-[9px] font-normal uppercase ${
                              isSelected
                                ? 'text-purple-100'
                                : slot.isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isSelected ? 'Selected' : slot.isAvailable ? 'Available' : 'Booked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Confirmation Summary if a slot is picked */}
              {isConfirmStep && selectedSlotTime && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-900">
                    <CheckCircleIcon size={18} weight="fill" className="text-purple-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Reschedule Confirmation Details
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">
                        Original Appointment
                      </p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {originalDateFormatted}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: <span className="text-rose-600 font-semibold">NO SHOW</span> (Queue #{request.originalAppointment.queueNumber})
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-purple-700 uppercase font-bold">
                        New Rescheduled Appointment
                      </p>
                      <p className="font-bold text-purple-950 mt-0.5">
                        {selectedDateFormatted}
                      </p>
                      <p className="text-[11px] font-bold text-purple-800">
                        Slot: {slotData?.slots.find((s) => s.time === selectedSlotTime)?.displayTime} (Next Queue Number Assigned)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Administrative Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Rescheduled upon patient emergency request"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Rejection Form */
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-900">
                <WarningCircleIcon size={18} weight="fill" className="text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Reject Reschedule Request
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Please state the reason for rejecting this reschedule request. The patient will be notified with this message.
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Doctor is fully booked for the requested period; please contact clinic reception."
                className="w-full rounded-lg border border-rose-200 bg-white p-3 text-xs text-slate-900 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          {!rejecting ? (
            <>
              <button
                type="button"
                onClick={() => setRejecting(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
              >
                Reject Request…
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedSlotTime || confirmMutation.isPending}
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition disabled:opacity-50 shadow-sm"
                >
                  {confirmMutation.isPending ? 'Confirming…' : 'Confirm Reschedule'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                ← Back to Reschedule Slots
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  onClick={handleReject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-sm"
                >
                  {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewRescheduleModal;
