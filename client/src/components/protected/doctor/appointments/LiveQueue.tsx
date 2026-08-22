import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  UserCheckIcon,
  XCircleIcon,
  UserMinusIcon,
} from "@phosphor-icons/react";
import type { DoctorAppointmentDTO, QueueSnapshot } from "../../../../types/doctorPortal.types";
import { StatusBadge } from "../shared/DoctorPortalAtoms";
import Badge from "../../../common/Badge";

interface LiveQueueProps {
  snapshot?: QueueSnapshot;
  isLoading: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onCancel: (id: string, reason?: string) => void;
  isPending: boolean;
}

const formatTimeRange = (timeStr?: string | null) => {
  if (!timeStr) return "—";
  try {
    return new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timeStr;
  }
};

const LiveQueue: React.FC<LiveQueueProps> = ({
  snapshot,
  isLoading,
  onStart,
  onComplete,
  onNoShow,
  onCancel,
  isPending,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-xl bg-slate-100 border border-slate-200" />
        <div className="h-36 rounded-xl bg-slate-100 border border-slate-200" />
        <div className="h-64 rounded-xl bg-slate-100 border border-slate-200" />
      </div>
    );
  }

  const { currentPatient, nextPatient, waitingQueue = [], historyQueue = [], summary } = snapshot || {
    currentPatient: null,
    nextPatient: null,
    waitingQueue: [],
    historyQueue: [],
    summary: { totalBooked: 0, waitingCount: 0, completedCount: 0, cancelledCount: 0, noShowCount: 0 },
  };

  return (
    <div className="space-y-5">
      {/* ─── Live Queue KPI Summary Bar ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <div className="cf-card p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Booked</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary.totalBooked}</p>
        </div>
        <div className="cf-card p-3.5 border-sky-200 bg-sky-50/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Waiting</p>
          <p className="mt-1 text-xl font-bold text-sky-800">{summary.waitingCount}</p>
        </div>
        <div className="cf-card p-3.5 border-emerald-200 bg-emerald-50/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Completed</p>
          <p className="mt-1 text-xl font-bold text-emerald-800">{summary.completedCount}</p>
        </div>
        <div className="cf-card p-3.5 border-amber-200 bg-amber-50/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">No Show</p>
          <p className="mt-1 text-xl font-bold text-amber-800">{summary.noShowCount}</p>
        </div>
        <div className="cf-card p-3.5 border-rose-200 bg-rose-50/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Cancelled</p>
          <p className="mt-1 text-xl font-bold text-rose-800">{summary.cancelledCount}</p>
        </div>
      </div>

      {/* ─── NOW CONSULTING SECTION ───────────────────────────────────── */}
      <div className="rounded-xl border-2 border-emerald-500 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Currently In Consultation
            </h2>
          </div>
          {currentPatient && (
            <Badge variant="in_consultation" size="md">
              Queue #{currentPatient.queueNumber}
            </Badge>
          )}
        </div>

        {currentPatient ? (
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900">{currentPatient.patient.fullName}</h3>
                <StatusBadge status={currentPatient.status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                <span>{currentPatient.patient.phone}</span>
                <span>•</span>
                <span>{currentPatient.patient.email}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <ClockIcon size={14} /> Started: {formatTimeRange(currentPatient.actualStartTime)}
                </span>
                {currentPatient.patient.gender && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] capitalize text-slate-700 font-medium">
                    {currentPatient.patient.gender.toLowerCase()}
                  </span>
                )}
                {currentPatient.patient.bloodGroup && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 font-medium">
                    Blood: {currentPatient.patient.bloodGroup.replace("_", "")}
                  </span>
                )}
              </div>
              {currentPatient.notes && (
                <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                  <span className="font-bold text-slate-900">Patient Notes: </span>
                  {currentPatient.notes}
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onComplete(currentPatient.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircleIcon size={18} weight="bold" />
                Complete Consultation
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs font-semibold text-slate-700">No patient is currently inside the consultation room</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Click "Start Consultation" on the next patient below when ready.</p>
          </div>
        )}
      </div>

      {/* ─── UP NEXT BANNER ───────────────────────────────────────────── */}
      {nextPatient && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-sm">
                #{nextPatient.queueNumber}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">UP NEXT</span>
                  {nextPatient.notes && <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">Has Notes</span>}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{nextPatient.patient.fullName}</h4>
                <p className="text-[11px] text-slate-500">
                  Estimated consultation time: <span className="font-semibold text-slate-800">{formatTimeRange(nextPatient.estimatedTime)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onStart(nextPatient.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                <PlayCircleIcon size={16} weight="bold" />
                Start Consultation
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onNoShow(nextPatient.id)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              >
                <UserMinusIcon size={15} />
                No-Show
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WAITING QUEUE TABLE ──────────────────────────────────────── */}
      <div className="cf-card overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Waiting Queue ({waitingQueue.length})
          </h3>
          <span className="text-[11px] text-slate-500">Order by Queue #</span>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <UserCheckIcon size={32} className="mx-auto text-slate-300 mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">The waiting queue is empty</p>
            <p className="text-[11px] text-slate-400">All patients for this session have been attended.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {waitingQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 px-5 hover:bg-slate-50/60 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 text-xs">
                    #{item.queueNumber}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{item.patient.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.patient.phone} • {item.patient.email}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col text-right">
                  <span className="font-semibold text-slate-800">
                    ETA: {formatTimeRange(item.estimatedTime)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Slot: {formatTimeRange(item.scheduledTime || item.appointmentTime)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onStart(item.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                  >
                    <PlayCircleIcon size={14} /> Start
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onNoShow(item.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    No-Show
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onCancel(item.id, "Cancelled by doctor")}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircleIcon size={13} /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── COMPLETED & HISTORY LOG ──────────────────────────────────── */}
      {historyQueue.length > 0 && (
        <details className="group cf-card overflow-hidden p-4">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
            <span>Completed & Activity Log ({historyQueue.length})</span>
            <span className="text-xs text-sky-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 divide-y divide-slate-100">
            {historyQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-slate-500">#{item.queueNumber}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{item.patient.fullName}</p>
                    <p className="text-[11px] text-slate-400">{item.patient.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={item.status} />
                  <span className="text-[11px] text-slate-400">
                    {formatTimeRange(item.actualEndTime || item.completedAt || item.cancelledAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default LiveQueue;

