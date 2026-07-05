import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheckIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  SealCheckIcon,
  StethoscopeIcon,
  UserCirclePlusIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import useDebounce from "../../../../hooks/useDebounce";
import { useAdminDoctors, useAdminDoctorSummary } from "../../../../hooks/useAdminDoctors";
import type { AdminDoctorListItemDTO, DoctorListStatus } from "../../../../types/adminDoctorList.types";
import { formatDisplayDateTime } from "../../../../utils/dateUtil";

const PAGE_SIZE = 20;

const STATUS_TABS: { label: string; value: DoctorListStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "ALL" },
];

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "DR";
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const statusClassName = (status: DoctorListStatus) => {
  if (status === "VERIFIED") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "REJECTED") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
};

const KpiSkeleton = () => <div className="h-28 animate-pulse rounded-[18px] border border-slate-200 bg-white" />;

const DoctorTableSkeleton = () => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={index} className="grid grid-cols-[1.6fr_1.1fr_1fr_1fr_0.7fr] gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-8 w-8 animate-pulse justify-self-end rounded-lg bg-slate-100" />
      </div>
    ))}
  </div>
);

const DoctorStatusBadge = ({ status }: { status: DoctorListStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(status)}`}>
    {status === "VERIFIED" ? "Verified" : status === "PENDING" ? "Pending" : status === "REJECTED" ? "Rejected" : "All"}
  </span>
);

const DoctorKpiCard = ({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
}) => (
  <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={20} weight="duotone" />
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-500">{helper}</p>
  </div>
);

const DoctorRow = ({ doctor }: { doctor: AdminDoctorListItemDTO }) => {
  const navigate = useNavigate();
  const profile = doctor.doctorProfile;

  if (!profile) return null;

  return (
    <tr className="group border-b border-slate-100 transition hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => navigate(`/admin/doctors/${doctor.id}`)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            {doctor.profileImage ? <img src={doctor.profileImage} alt="" className="h-full w-full rounded-full object-cover" /> : initials(doctor.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950 group-hover:text-blue-700">{doctor.fullName}</p>
            <p className="truncate text-xs text-slate-500">{doctor.email} · {doctor.phone}</p>
          </div>
        </button>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-900">{profile.registrationNumber}</p>
        <p className="text-xs text-slate-500">{profile.medicalCouncilName}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-900">{profile.department}</p>
        <p className="text-xs text-slate-500">{profile.specializations.slice(0, 2).join(", ") || "No specialization"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-900">{money(profile.consultationFee)}</p>
        <p className="text-xs text-slate-500">{profile.employmentType.replace("_", " ").toLowerCase()}</p>
      </td>
      <td className="px-5 py-4">
        <DoctorStatusBadge status={profile.verificationStatus} />
        <p className="mt-1 text-xs text-slate-400">{formatDisplayDateTime(profile.submittedAt)}</p>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          aria-label="Open doctor profile"
          onClick={() => navigate(`/admin/doctors/${doctor.id}`)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700 hover:shadow-sm"
        >
          <DotsThreeVerticalIcon size={18} weight="bold" />
        </button>
      </td>
    </tr>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <StethoscopeIcon size={24} weight="duotone" />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-slate-950">No doctors found</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">Try changing the status tab, search text, department, or specialization filter.</p>
  </div>
);

const DoctorManagement = () => {
  const [status, setStatus] = useState<DoctorListStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [page, setPage] = useState(0);

  const debouncedSetSearch = useDebounce((value: string) => {
    setDebouncedSearch(value);
    setPage(0);
  }, 350);

  const filters = useMemo(
    () => ({
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
      status,
      search: debouncedSearch.trim() || undefined,
      department: department.trim() || undefined,
      specialization: specialization.trim() || undefined,
      sortBy: "CREATED_AT" as const,
      sortOrder: "desc" as const,
    }),
    [page, status, debouncedSearch, department, specialization]
  );

  const summaryQuery = useAdminDoctorSummary();
  const doctorsQuery = useAdminDoctors(filters);

  const doctors = doctorsQuery.data?.data ?? [];
  const pagination = doctorsQuery.data?.pagination;
  const currentStart = pagination ? pagination.skip + 1 : 0;
  const currentEnd = pagination ? pagination.skip + doctors.length : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Admin workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Doctor Management</h1>
          <p className="mt-1 text-sm text-slate-500">Verify doctor applications, inspect credentials, and monitor availability from one premium workflow.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <DownloadSimpleIcon size={18} /> Export
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <UserCirclePlusIcon size={18} weight="bold" /> Add Doctor
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryQuery.isLoading ? (
          <>
            <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
          </>
        ) : (
          <>
            <DoctorKpiCard label="Pending Doctors" value={String(summaryQuery.data?.pendingDoctors ?? 0)} helper="Awaiting admin verification" icon={WarningCircleIcon} />
            <DoctorKpiCard label="Verified Doctors" value={String(summaryQuery.data?.verifiedDoctors ?? 0)} helper="Approved for consultations" icon={SealCheckIcon} />
            <DoctorKpiCard label="Rejected Doctors" value={String(summaryQuery.data?.rejectedDoctors ?? 0)} helper="Applications rejected after review" icon={XCircleIcon} />
            <DoctorKpiCard label="Active Availability" value={String(summaryQuery.data?.activeAvailability ?? 0)} helper="Open weekly availability slots" icon={CalendarCheckIcon} />
          </>
        )}
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  debouncedSetSearch(event.target.value);
                }}
                placeholder="Search by doctor, email, phone, registration..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={department}
                onChange={(event) => {
                  setDepartment(event.target.value);
                  setPage(0);
                }}
                placeholder="Department"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
              <input
                value={specialization}
                onChange={(event) => {
                  setSpecialization(event.target.value);
                  setPage(0);
                }}
                placeholder="Specialization"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <FunnelSimpleIcon size={18} /> Filters
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatus(tab.value);
                  setPage(0);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${status === tab.value ? "bg-slate-950 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {doctorsQuery.isLoading ? (
            <DoctorTableSkeleton />
          ) : doctorsQuery.isError ? (
            <div className="px-6 py-12 text-center text-sm text-rose-600">Unable to load doctors. Please try again.</div>
          ) : doctors.length === 0 ? (
            <EmptyState />
          ) : (
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Registration</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Fee / Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => <DoctorRow key={doctor.id} doctor={doctor} />)}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pagination && pagination.total > 0 ? `Showing ${currentStart}-${currentEnd} of ${pagination.total} doctors` : "No doctors to display"}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0 || doctorsQuery.isFetching}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={!pagination?.hasMore || doctorsQuery.isFetching}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DoctorManagement;
