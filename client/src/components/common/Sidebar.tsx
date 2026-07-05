import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheckIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  GearSixIcon,
  HeartbeatIcon,
  SquaresFourIcon,
  StethoscopeIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useUser } from "../../context/UserContext";

const SIDEBAR_COLLAPSE_KEY = "clinicflow_sidebar_collapsed";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  end?: boolean;
}

const Sidebar = () => {
  const { user } = useUser();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  if (!user) return null;

  const NAV_LINKS_BY_ROLE: Record<string, NavItem[]> = {
    ADMIN: [
      { label: "Dashboard", path: "/admin", icon: SquaresFourIcon, end: true },
      { label: "Doctors", path: "/admin/doctors", icon: StethoscopeIcon },
      { label: "Patients", path: "/admin/users", icon: HeartbeatIcon },
      { label: "Appointments", path: "/admin/appointments", icon: CalendarCheckIcon },
      { label: "Analytics", path: "/admin/analytics", icon: ChartLineUpIcon },
      { label: "Settings", path: "/admin/settings", icon: GearSixIcon },
    ],
    DOCTOR: [
      {
        label: "Dashboard",
        path: `/doctor/dashboard/${user.id}`,
        icon: SquaresFourIcon,
        end: true,
      },
      {
        label: "Appointments",
        path: `/doctor/dashboard/${user.id}/appointments`,
        icon: UsersIcon,
      },
      {
        label: "Availability",
        path: `/doctor/dashboard/${user.id}/availability`,
        icon: CalendarCheckIcon,
      },
      {
        label: "Profile",
        path: `/doctor/profile`,
        icon: StethoscopeIcon,
      },
      {
        label: "Settings",
        path: `/doctor/profile/change-password`,
        icon: GearSixIcon,
      },
    ],
    PATIENT: [
      {
        label: "Dashboard",
        path: `/patient/dashboard/${user.id}`,
        icon: SquaresFourIcon,
        end: true,
      },
      {
        label: "Find Doctors",
        path: `/patient/dashboard/${user.id}/book`,
        icon: StethoscopeIcon,
      },
      {
        label: "My Appointments",
        path: `/patient/dashboard/${user.id}/appointments`,
        icon: CalendarCheckIcon,
      },
      {
        label: "Profile",
        path: `/patient/dashboard/${user.id}/profile`,
        icon: HeartbeatIcon,
      },
    ],
  };

  const links = NAV_LINKS_BY_ROLE[user.role] ?? [];

  return (
    <aside className={`sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-slate-950 text-white transition-all ${collapsed ? "w-20" : "w-72"}`}>
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25">
            C
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-white">ClinicFlow</p>
              <p className="text-xs text-slate-400">Enterprise clinic OS</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <CaretRightIcon size={16} /> : <CaretLeftIcon size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-medium text-slate-400">Current workspace</p>
          <p className="mt-1 text-sm font-semibold text-white">{user.role === "ADMIN" ? "Admin Portal" : `${user.role.toLowerCase()} portal`}</p>
        </div>
      )}

      <nav className="mt-5 flex-1 space-y-1 px-3">
        {!collapsed && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Navigation</p>}
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <link.icon size={20} weight="duotone" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {user.fullName?.slice(0, 2).toUpperCase() ?? user.role.slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.fullName ?? "ClinicFlow User"}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
