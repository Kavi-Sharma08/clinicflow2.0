// client/src/components/protected/admin/UsersList.tsx
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CheckCircleIcon, DotsThreeVerticalIcon } from "@phosphor-icons/react";
import api from "../../../lib/axios";
import TableSkeleton from "../../common/TableSkeleton";
import InfiniteScrollLoader from "../../common/InfiniteScrollLoader";
import { formatDisplayDateTime } from "../../../utils/dateUtil";
import SearchInput from "../../common/SearchInput";
import CustomSelect from "../../custom-tags/CustomSelect";
import useDebounce from "../../../hooks/useDebounce";
import { useState } from "react";
import { UserStatsCards } from "./UserStatsCard";
import { RoleBadge, DoctorVerificationStatus, EmailVerifiedStatus } from "./UserBadges";

type RoleFilter = "ALL" | "DOCTOR" | "PATIENT";
type VerifiedFilter = "ALL" | "VERIFIED" | "NOT_VERIFIED";
type DoctorStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";

interface BaseUserRow {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  role: "DOCTOR" | "PATIENT";
}
interface DoctorRow extends BaseUserRow {
  role: "DOCTOR";
  verificationStatus: DoctorStatus;
  doctorProfileId: string | null;
}
interface PatientRow extends BaseUserRow {
  role: "PATIENT";
}
type UserRow = DoctorRow | PatientRow;

interface UsersPageResponse {
  data: UserRow[];
  pagination: { hasMore: boolean };
}

const ROLE_OPTIONS: { label: string; value: RoleFilter }[] = [
  { label: "All Users", value: "ALL" },
  { label: "Doctors", value: "DOCTOR" },
  { label: "Patients", value: "PATIENT" },
];

const LIMIT = 20;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0]?.toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const UsersList = () => {
  const navigate = useNavigate();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"NAME" | "CREATED_AT">("CREATED_AT");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSetSearch = useDebounce((value: string) => setDebouncedSearch(value), 350);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSetSearch(value);
  };

  const buildParams = (skip: number) => ({
    skip,
    limit: LIMIT,
    role: roleFilter,
    ...(verifiedFilter === "VERIFIED" ? { isVerified: true } : {}),
    ...(verifiedFilter === "NOT_VERIFIED" ? { isVerified: false } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    sortBy,
    sortOrder,
  });

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["admin-users", roleFilter, verifiedFilter, sortBy, sortOrder, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<UsersPageResponse>("/admin/users", { params: buildParams(pageParam) });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return allPages.reduce((sum, page) => sum + page.data.length, 0);
    },
  });

  const users: UserRow[] = data?.pages.flatMap((page) => page.data) ?? [];

  const toggleSort = (column: "NAME" | "CREATED_AT") => {
    const nextOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(nextOrder);
  };

  return (
    <div className="space-y-5">
      <section className="cf-card p-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">User Directory</h1>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-bold text-sky-700">
            Admin Portal
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Manage system users, doctors, and patients. View verification statuses and activity.
        </p>
      </section>

      <UserStatsCards />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Search users by name or email..." />
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            variant="compact"
            options={ROLE_OPTIONS}
            isClearable={false}
            value={ROLE_OPTIONS.find((o) => o.value === roleFilter) ?? null}
            onChange={(option) => setRoleFilter((option?.value as RoleFilter) ?? "ALL")}
          />
          <CustomSelect
            variant="compact"
            options={[
              { label: "Verified: All", value: "ALL" },
              { label: "Verified", value: "VERIFIED" },
              { label: "Unverified", value: "NOT_VERIFIED" },
            ]}
            isClearable={false}
            value={{ label: `Verified: ${verifiedFilter === "ALL" ? "All" : verifiedFilter === "VERIFIED" ? "Yes" : "No"}`, value: verifiedFilter }}
            onChange={(option) => setVerifiedFilter((option?.value as VerifiedFilter) ?? "ALL")}
          />
        </div>
      </div>

      <div className="cf-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={4} />
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">No users match your filters.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="cursor-pointer select-none px-5 py-3 text-left font-medium text-slate-500" onClick={() => toggleSort("NAME")}>
                    User {sortBy === "NAME" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">Role</th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">Email</th>
                  <th className="cursor-pointer select-none px-5 py-3 text-left font-medium text-slate-500" onClick={() => toggleSort("CREATED_AT")}>
                    Joined On {sortBy === "CREATED_AT" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                          {initials(u.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`flex items-center gap-1 truncate font-medium text-slate-900 ${u.role === "DOCTOR" ? "cursor-pointer hover:text-blue-600" : ""}`}
                            onClick={() => u.role === "DOCTOR" && navigate(`/admin/doctors/${u.id}`)}
                          >
                            {u.fullName}
                            {u.isVerified && <CheckCircleIcon size={14} weight="fill" className="shrink-0 text-sky-500" />}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3">
                      {u.role === "DOCTOR" ? <DoctorVerificationStatus status={u.verificationStatus} /> : <EmailVerifiedStatus isVerified={u.isVerified} />}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDisplayDateTime(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        aria-label="More actions"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                        onClick={() => u.role === "DOCTOR" && navigate(`/admin/doctors/${u.id}`)}   
                      >
                        <DotsThreeVerticalIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isFetchingNextPage && <InfiniteScrollLoader />}
            {hasNextPage && !isFetchingNextPage && (
              <button
                onClick={() => fetchNextPage()}
                className="w-full border-t border-slate-100 py-3 text-sm font-medium text-blue-600 hover:bg-slate-50"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersList;