import { useState, useMemo } from 'react';
import {
  CalendarCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsClockwiseIcon,
  FunnelSimpleIcon,
  EyeIcon,
  UserCircleIcon,
  StethoscopeIcon,
  UserMinusIcon,
} from '@phosphor-icons/react';
import {
  useAdminAppointments,
  useAdminAppointmentStats,
  useAdminRescheduleRequests,
} from '../../../../hooks/useAdminAppointments';
import type {
  AdminAppointment,
  AdminAppointmentFilters,
  AppointmentStatus,
  RescheduleRequestDTO,
  RescheduleRequestStatus,
} from '../../../../types/adminAppointment.types';
import SearchInput from '../../../common/SearchInput';
import useDebounce from '../../../../hooks/useDebounce';
import Badge from '../../../common/Badge';
import ReviewRescheduleModal from './ReviewRescheduleModal';
import AppointmentDetailsDrawer from './AppointmentDetailsDrawer';

type ActiveTab = 'APPOINTMENTS' | 'RESCHEDULE_REQUESTS';

const STATUS_OPTIONS: { label: string; value: AppointmentStatus | 'ALL' }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Checked In', value: 'CHECKED_IN' },
  { label: 'Waiting', value: 'WAITING' },
  { label: 'In Consultation', value: 'IN_CONSULTATION' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'No Show', value: 'NO_SHOW' },
  { label: 'Rescheduled', value: 'RESCHEDULED' },
];

export const AdminAppointments = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('APPOINTMENTS');

  // Filters state for Appointments
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Filter state for Reschedule Requests
  const [rescheduleStatusFilter, setRescheduleStatusFilter] = useState<
    RescheduleRequestStatus | 'ALL'
  >('ALL');
  const [rescheduleSearch, setRescheduleSearch] = useState('');
  const [debouncedRescheduleSearch, setDebouncedRescheduleSearch] = useState('');
  const [reschedulePage, setReschedulePage] = useState(1);

  // Selected for Drawers / Modals
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<RescheduleRequestDTO | null>(null);

  const debouncedSetSearch = useDebounce((val: string) => {
    setDebouncedSearch(val);
    setPage(1);
  }, 350);

  const debouncedSetRescheduleSearch = useDebounce((val: string) => {
    setDebouncedRescheduleSearch(val);
    setReschedulePage(1);
  }, 350);

  // Queries
  const statsQuery = useAdminAppointmentStats();
  const stats = statsQuery.data;

  const appointmentFilters: AdminAppointmentFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      date: dateFilter.trim() || undefined,
    }),
    [page, pageSize, debouncedSearch, statusFilter, dateFilter]
  );

  const appointmentsQuery = useAdminAppointments(appointmentFilters);
  const appointmentsData = appointmentsQuery.data?.data ?? [];
  const meta = appointmentsQuery.data?.meta;

  const rescheduleQuery = useAdminRescheduleRequests({
    page: reschedulePage,
    limit: pageSize,
    status: rescheduleStatusFilter,
    search: debouncedRescheduleSearch.trim() || undefined,
  });
  const rescheduleList = rescheduleQuery.data?.data ?? [];
  const rescheduleMeta = rescheduleQuery.data?.meta;

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setDateFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Appointment Management
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Monitor clinic appointments, manage lifecycle status, review no-show reschedule requests, and resolve conflicts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('APPOINTMENTS')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'APPOINTMENTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheckIcon size={16} /> All Appointments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESCHEDULE_REQUESTS')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'RESCHEDULE_REQUESTS'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowsClockwiseIcon size={16} />
            Reschedule Requests
            {stats && stats.pendingReschedules > 0 && (
              <span className="rounded-full bg-purple-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {stats.pendingReschedules}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── KPI Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Total</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{stats?.todayAppointments ?? 0}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Waiting</p>
          <p className="mt-1 text-xl font-bold text-amber-900">{stats?.waiting ?? 0}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">In Consultation</p>
          <p className="mt-1 text-xl font-bold text-emerald-900">{stats?.inConsultation ?? 0}</p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Completed</p>
          <p className="mt-1 text-xl font-bold text-teal-900">{stats?.completed ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-slate-100/70 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">No Shows</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{stats?.noShows ?? 0}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Cancelled</p>
          <p className="mt-1 text-xl font-bold text-rose-900">{stats?.cancelled ?? 0}</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('RESCHEDULE_REQUESTS')}
          className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 shadow-2xs text-left hover:bg-purple-100/70 transition cursor-pointer"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center justify-between">
            Pending Reschedules
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping" />
          </p>
          <p className="mt-1 text-xl font-bold text-purple-900">{stats?.pendingReschedules ?? 0}</p>
        </button>
      </div>

      {/* ─── TAB 1: All Appointments ────────────────────────────────────── */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="space-y-4">
          {/* Toolbar & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="w-full sm:w-72">
                <SearchInput
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    debouncedSetSearch(e.target.value);
                  }}
                  onClear={() => {
                    setSearch('');
                    debouncedSetSearch('');
                  }}
                  placeholder="Search patient, doctor, phone, ID..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden"
              />

              {(search || statusFilter !== 'ALL' || dateFilter) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                >
                  Reset filters
                </button>
              )}
            </div>

            <div className="text-xs font-medium text-slate-500">
              Total: <span className="font-bold text-slate-900">{meta?.total ?? 0}</span> visits
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Queue #</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Created At</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointmentsQuery.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="h-6 rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : appointmentsData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <CalendarCheckIcon size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-900">No appointments found</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Try adjusting search terms or changing selected filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    appointmentsData.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                        onClick={() => setSelectedAppointmentId(app.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs shrink-0">
                              {app.patient.fullName[0]?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{app.patient.fullName}</p>
                              <p className="text-[11px] text-slate-500">{app.patient.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-bold text-slate-900">{app.doctor.fullName}</p>
                            <p className="text-[11px] text-slate-500">{app.doctor.department}</p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {new Date(app.appointmentDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {app.scheduledTime
                                ? new Date(app.scheduledTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            #{app.queueNumber}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant={app.status.toLowerCase() as any} size="sm" dot>
                            {app.status.replace('_', ' ')}
                          </Badge>
                          {app.rescheduleRequest?.status === 'PENDING' && (
                            <span className="block mt-1 text-[10px] font-bold text-purple-700">
                              • Reschedule Requested
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {app.rescheduleRequest?.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewingRequest({
                                    id: app.rescheduleRequest!.id,
                                    appointmentId: app.id,
                                    patientId: app.patient.id,
                                    doctorId: app.doctor.id,
                                    reason: app.rescheduleRequest!.reason,
                                    requestedDate: app.rescheduleRequest!.requestedDate,
                                    status: app.rescheduleRequest!.status,
                                    rejectionReason: app.rescheduleRequest!.rejectionReason,
                                    createdAt: app.rescheduleRequest!.createdAt,
                                    patient: app.patient,
                                    doctor: app.doctor,
                                    originalAppointment: app,
                                  })
                                }
                                className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                              >
                                Review Request
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedAppointmentId(app.id)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Page <span className="font-bold">{meta.page}</span> of{' '}
                  <span className="font-bold">{meta.totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Reschedule Requests ─────────────────────────────────── */}
      {activeTab === 'RESCHEDULE_REQUESTS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="w-full sm:w-72">
                <SearchInput
                  value={rescheduleSearch}
                  onChange={(e) => {
                    setRescheduleSearch(e.target.value);
                    debouncedSetRescheduleSearch(e.target.value);
                  }}
                  onClear={() => {
                    setRescheduleSearch('');
                    debouncedSetRescheduleSearch('');
                  }}
                  placeholder="Search patient, doctor..."
                />
              </div>

              <select
                value={rescheduleStatusFilter}
                onChange={(e) => {
                  setRescheduleStatusFilter(e.target.value as any);
                  setReschedulePage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-purple-500 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="text-xs font-medium text-slate-500">
              Total: <span className="font-bold text-slate-900">{rescheduleMeta?.total ?? 0}</span> requests
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-4 py-3.5">Original Appointment</th>
                    <th className="px-4 py-3.5">Reason</th>
                    <th className="px-4 py-3.5">Requested For</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rescheduleQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="h-6 rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : rescheduleList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <ArrowsClockwiseIcon size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-900">No reschedule requests found</p>
                      </td>
                    </tr>
                  ) : (
                    rescheduleList.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{req.patient.fullName}</p>
                          <p className="text-[11px] text-slate-500">{req.patient.phone}</p>
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{req.doctor.fullName}</p>
                          <p className="text-[11px] text-slate-500">{req.doctor.department}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">
                            {new Date(req.originalAppointment.appointmentDate).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Queue #{req.originalAppointment.queueNumber} · {req.originalAppointment.status}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs truncate text-slate-700">
                          {req.reason || '—'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          {req.requestedDate
                            ? new Date(req.requestedDate).toLocaleDateString()
                            : 'Earliest available'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              req.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {req.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => setReviewingRequest(req)}
                              className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700 transition shadow-2xs"
                            >
                              Review & Assign Slot
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedAppointmentId(req.originalAppointment.id)}
                              className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                            >
                              View Visit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {rescheduleMeta && rescheduleMeta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Page <span className="font-bold">{rescheduleMeta.page}</span> of{' '}
                  <span className="font-bold">{rescheduleMeta.totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={rescheduleMeta.page <= 1}
                    onClick={() => setReschedulePage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={rescheduleMeta.page >= rescheduleMeta.totalPages}
                    onClick={() => setReschedulePage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Drawer & Modals ────────────────────────────────────────────── */}
      {selectedAppointmentId && (
        <AppointmentDetailsDrawer
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          onSelectAppointment={(id) => setSelectedAppointmentId(id)}
          onOpenRescheduleReview={(req) => {
            setSelectedAppointmentId(null);
            setReviewingRequest(req);
          }}
        />
      )}

      {reviewingRequest && (
        <ReviewRescheduleModal
          request={reviewingRequest}
          onClose={() => setReviewingRequest(null)}
          onSuccess={() => {
            appointmentsQuery.refetch();
            statsQuery.refetch();
            rescheduleQuery.refetch();
          }}
        />
      )}
    </div>
  );
};

export default AdminAppointments;
