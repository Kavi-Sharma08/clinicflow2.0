import React, { useState } from 'react';
import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
  StethoscopeIcon,
  ArrowRightIcon,
  XIcon,
  WarningOctagonIcon,
  ArrowsClockwiseIcon,
} from '@phosphor-icons/react';
import type { AdminAppointment, AppointmentStatus } from '../../../../types/adminAppointment.types';
import { useAdminAppointmentDetail, useUpdateAdminAppointmentStatus } from '../../../../hooks/useAdminAppointments';
import Badge from '../../../common/Badge';

interface AppointmentDetailsDrawerProps {
  appointmentId: string | null;
  onClose: () => void;
  onOpenRescheduleReview?: (request: any) => void;
  onSelectAppointment?: (id: string) => void;
}

const NEXT_STATUS_OPTIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string; color: string }[]> = {
  BOOKED: [
    { status: 'CHECKED_IN', label: 'Mark Checked-In', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
    { status: 'WAITING', label: 'Move to Waiting', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { status: 'IN_CONSULTATION', label: 'Start Consultation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { status: 'CANCELLED', label: 'Cancel Visit', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
    { status: 'NO_SHOW', label: 'Mark No-Show', color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' },
  ],
  CHECKED_IN: [
    { status: 'WAITING', label: 'Move to Waiting', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { status: 'IN_CONSULTATION', label: 'Start Consultation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { status: 'CANCELLED', label: 'Cancel Visit', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
    { status: 'NO_SHOW', label: 'Mark No-Show', color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' },
  ],
  WAITING: [
    { status: 'IN_CONSULTATION', label: 'Start Consultation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { status: 'CANCELLED', label: 'Cancel Visit', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
    { status: 'NO_SHOW', label: 'Mark No-Show', color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' },
  ],
  IN_CONSULTATION: [
    { status: 'COMPLETED', label: 'Complete Consultation', color: 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold' },
    { status: 'CANCELLED', label: 'Cancel', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: [],
};

export const AppointmentDetailsDrawer: React.FC<AppointmentDetailsDrawerProps> = ({
  appointmentId,
  onClose,
  onOpenRescheduleReview,
  onSelectAppointment,
}) => {
  const { data: appointment, isLoading } = useAdminAppointmentDetail(appointmentId ?? undefined);
  const updateStatusMutation = useUpdateAdminAppointmentStatus();

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!appointmentId) return null;

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    if (newStatus === 'CANCELLED') {
      setConfirmingCancel(true);
      return;
    }
    updateStatusMutation.mutate({
      id: appointmentId,
      status: newStatus,
    });
  };

  const handleConfirmCancel = () => {
    updateStatusMutation.mutate(
      {
        id: appointmentId,
        status: 'CANCELLED',
        cancellationReason: cancelReason.trim() || 'Cancelled by administrator',
      },
      {
        onSuccess: () => {
          setConfirmingCancel(false);
          setCancelReason('');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                #{appointment?.id.slice(-8)}
              </span>
              {appointment && (
                <Badge variant={appointment.status.toLowerCase() as any} size="sm" dot>
                  {appointment.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">
              Appointment Overview
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

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 rounded-xl bg-slate-100" />
              <div className="h-28 rounded-xl bg-slate-100" />
              <div className="h-44 rounded-xl bg-slate-100" />
            </div>
          ) : !appointment ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Appointment could not be loaded.
            </div>
          ) : (
            <>
              {/* Linked Reschedule Banner */}
              {appointment.status === 'RESCHEDULED' && appointment.rescheduledTo && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-purple-900">
                      <ArrowsClockwiseIcon size={18} weight="bold" className="text-purple-700" />
                      <div>
                        <p className="text-xs font-bold">This appointment was rescheduled</p>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          New appointment on {new Date(appointment.rescheduledTo.appointmentDate).toLocaleDateString()} (Queue #{appointment.rescheduledTo.queueNumber})
                        </p>
                      </div>
                    </div>
                    {onSelectAppointment && (
                      <button
                        type="button"
                        onClick={() => onSelectAppointment(appointment.rescheduledTo!.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs"
                      >
                        View New →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {appointment.rescheduledFrom && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-blue-900">
                      <ArrowsClockwiseIcon size={18} weight="bold" className="text-blue-700" />
                      <div>
                        <p className="text-xs font-bold">Rescheduled from previous appointment</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          Original was on {new Date(appointment.rescheduledFrom.appointmentDate).toLocaleDateString()} (Queue #{appointment.rescheduledFrom.queueNumber})
                        </p>
                      </div>
                    </div>
                    {onSelectAppointment && (
                      <button
                        type="button"
                        onClick={() => onSelectAppointment(appointment.rescheduledFrom!.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                      >
                        View Original →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Reschedule Request Callout */}
              {appointment.rescheduleRequest && appointment.rescheduleRequest.status === 'PENDING' && (
                <div className="rounded-xl border-2 border-purple-300 bg-purple-50/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded">
                      Action Required
                    </span>
                    <span className="text-[10px] text-purple-600">
                      Requested {new Date(appointment.rescheduleRequest.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-950">
                      Patient submitted a reschedule request
                    </p>
                    <p className="text-xs text-purple-800 mt-0.5 italic">
                      "{appointment.rescheduleRequest.reason || 'No reason provided'}"
                    </p>
                  </div>
                  {onOpenRescheduleReview && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenRescheduleReview({
                          id: appointment.rescheduleRequest!.id,
                          appointmentId: appointment.id,
                          patientId: appointment.patient.id,
                          doctorId: appointment.doctor.id,
                          reason: appointment.rescheduleRequest!.reason,
                          requestedDate: appointment.rescheduleRequest!.requestedDate,
                          status: appointment.rescheduleRequest!.status,
                          createdAt: appointment.rescheduleRequest!.createdAt,
                          patient: appointment.patient,
                          doctor: appointment.doctor,
                          originalAppointment: appointment,
                        })
                      }
                      className="w-full rounded-lg bg-purple-700 py-2 text-xs font-bold text-white hover:bg-purple-800 transition shadow-xs text-center"
                    >
                      Review & Select Reschedule Slot →
                    </button>
                  )}
                </div>
              )}

              {/* Key Appointment Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Queue #</p>
                  <p className="mt-1 text-lg font-bold text-sky-700">#{appointment.queueNumber}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Time</p>
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {appointment.scheduledTime
                      ? new Date(appointment.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fee</p>
                  <p className="mt-1 text-xs font-bold text-emerald-700">
                    ₹{appointment.consultationFee}
                  </p>
                </div>
              </div>

              {/* Patient Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCircleIcon size={16} /> Patient Information
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">
                    {appointment.patient.patientId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{appointment.patient.fullName}</p>
                    <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                      <PhoneIcon size={12} /> {appointment.patient.phone}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                      <EnvelopeIcon size={12} /> {appointment.patient.email}
                    </p>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-400">Gender:</span> {appointment.patient.gender || 'Not specified'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-400">Blood Group:</span> {appointment.patient.bloodGroup || '—'}
                    </p>
                    {appointment.patient.emergencyContactName && (
                      <p>
                        <span className="font-semibold text-slate-400">Emergency:</span> {appointment.patient.emergencyContactName} ({appointment.patient.emergencyContactPhone || '—'})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Doctor Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <StethoscopeIcon size={16} /> Doctor Information
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {appointment.doctor.department}
                  </span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">{appointment.doctor.fullName}</p>
                  <p className="text-slate-500 mt-0.5">{appointment.doctor.specializations?.join(', ')}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>{appointment.doctor.phone}</span>
                    <span>•</span>
                    <span>{appointment.doctor.email}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Cancellation Details */}
              {appointment.notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Notes: </span>
                  {appointment.notes}
                </div>
              )}

              {appointment.cancellationReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800">
                  <span className="font-bold">Cancellation Reason: </span>
                  {appointment.cancellationReason}
                </div>
              )}

              {/* Status Transition Action Buttons */}
              {NEXT_STATUS_OPTIONS[appointment.status]?.length > 0 && !confirmingCancel && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Available State Transitions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUS_OPTIONS[appointment.status].map((opt) => (
                      <button
                        key={opt.status}
                        type="button"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => handleStatusChange(opt.status)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${opt.color} disabled:opacity-50`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline Cancel Reason Prompt */}
              {confirmingCancel && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
                  <p className="text-xs font-bold text-rose-900">
                    Reason for Cancellation
                  </p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter cancellation reason..."
                    className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-rose-500 focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Keep Visit
                    </button>
                    <button
                      type="button"
                      disabled={updateStatusMutation.isPending}
                      onClick={handleConfirmCancel}
                      className="rounded-lg bg-rose-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      {updateStatusMutation.isPending ? 'Cancelling…' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {/* Audit Trail Timeline */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1">
                  Appointment History & Audit Trail
                </p>

                {appointment.audits && appointment.audits.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {appointment.audits.map((audit) => (
                      <div key={audit.id} className="relative">
                        <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                        <div className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{audit.action}</span>
                            <span className="text-[10px] text-slate-400">
                              {audit.createdAt ? new Date(audit.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                          </div>
                          {audit.previousStatus && audit.newStatus && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Status changed: <span className="font-semibold">{audit.previousStatus}</span> → <span className="font-semibold text-slate-900">{audit.newStatus}</span>
                            </p>
                          )}
                          {audit.reason && (
                            <p className="text-[11px] text-slate-600 mt-0.5 italic">
                              "{audit.reason}"
                            </p>
                          )}
                          {audit.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {audit.notes}
                            </p>
                          )}
                          {audit.performedBy && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              By {audit.performedBy.name} ({audit.performedBy.role})
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous audit records found.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsDrawer;
