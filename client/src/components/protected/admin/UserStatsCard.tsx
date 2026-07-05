// client/src/components/protected/admin/UserStatsCards.tsx
import { useQuery } from "@tanstack/react-query";
import { ClockIcon, StethoscopeIcon, UserIcon, UsersIcon } from "@phosphor-icons/react";
import api from "../../../lib/axios";
import { QUERY_KEYS } from "../../../constants/queryKeys";

interface CountResponse {
  pagination: { total: number };
}

async function fetchCount(params: Record<string, string>) {
  const { data } = await api.get<CountResponse>("/admin/users", {
    params: { ...params, limit: 1, skip: 0 },
  });
  return data.pagination.total;
}

export function UserStatsCards() {
  const totalQuery = useQuery({
    queryKey: [QUERY_KEYS.userStats, "total"],
    queryFn: () => fetchCount({ role: "ALL" }),
    staleTime: 60 * 1000,
  });
  const doctorsQuery = useQuery({
    queryKey: [QUERY_KEYS.userStats, "doctors"],
    queryFn: () => fetchCount({ role: "DOCTOR" }),
    staleTime: 60 * 1000,
  });
  const patientsQuery = useQuery({
    queryKey: [QUERY_KEYS.userStats, "patients"],
    queryFn: () => fetchCount({ role: "PATIENT" }),
    staleTime: 60 * 1000,
  });
  const pendingQuery = useQuery({
    queryKey: [QUERY_KEYS.userStats, "pending-doctors"],
    queryFn: () => fetchCount({ role: "DOCTOR", verificationStatus: "PENDING" }),
    staleTime: 60 * 1000,
  });

  const cards = [
    { label: "Total Users", value: totalQuery.data, icon: UsersIcon, tint: "bg-indigo-50 text-indigo-600" },
    { label: "Doctors", value: doctorsQuery.data, icon: StethoscopeIcon, tint: "bg-emerald-50 text-emerald-600" },
    { label: "Patients", value: patientsQuery.data, icon: UserIcon, tint: "bg-violet-50 text-violet-600" },
    { label: "Pending Doctors", value: pendingQuery.data, icon: ClockIcon, tint: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tint}`}>
            <card.icon size={18} weight="bold" />
          </div>
          <p className="mt-3 text-xs font-medium text-gray-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {card.value === undefined ? (
              <span className="inline-block h-6 w-12 animate-pulse rounded bg-gray-100" />
            ) : (
              card.value.toLocaleString()
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
