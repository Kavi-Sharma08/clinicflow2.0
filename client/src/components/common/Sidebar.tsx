import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheckIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  GearSixIcon,
  HeartbeatIcon,
  ListIcon,
  SquaresFourIcon,
  StethoscopeIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useUser } from "../../context/UserContext";

const SIDEBAR_COLLAPSE_KEY = "clinicflow_sidebar_collapsed";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  end?: boolean;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const { user } = useUser();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    return stored === "true";
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  // Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [mobileOpen]);

  // Escape key closes sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        onMobileClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  if (!user) return null;

  const NAV_LINKS_BY_ROLE: Record<string, NavItem[]> = {
    ADMIN: [
      { label: "Dashboard", path: "/admin", icon: SquaresFourIcon, end: true },
      { label: "Doctors", path: "/admin/doctors", icon: StethoscopeIcon },
      { label: "Patients", path: "/admin/users", icon: UsersIcon },
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
        icon: CalendarCheckIcon,
      },
      {
        label: "Availability",
        path: `/doctor/dashboard/${user.id}/availability`,
        icon: ListIcon,
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

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin Portal"
      : user.role === "DOCTOR"
      ? "Doctor Portal"
      : "Patient Portal";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside
      className={`flex h-full flex-col bg-slate-950 text-white ${
        isMobile ? "w-[272px]" : collapsed ? "w-[72px]" : "w-[272px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/30">
            C
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold tracking-tight text-white">ClinicFlow</p>
              <p className="text-[11px] text-slate-500">Enterprise clinic OS</p>
            </div>
          )}
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <CaretRightIcon size={16} /> : <CaretLeftIcon size={16} />}
          </button>
        )}
      </div>

      {/* Workspace pill */}
      {(!collapsed || isMobile) && (
        <div className="mx-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Workspace
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-300">{roleLabel}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {(!collapsed || isMobile) && (
          <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            Navigation
          </p>
        )}
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
              } ${collapsed && !isMobile ? "justify-center" : ""}`
            }
          >
            <link.icon size={18} weight="duotone" className="shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.07] p-3">
        <div
          className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${
            collapsed && !isMobile ? "justify-center" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-[11px] font-bold text-blue-300">
            {user.fullName?.slice(0, 2).toUpperCase() ?? user.role.slice(0, 2)}
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {user.fullName ?? "ClinicFlow User"}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex shrink-0 flex-col border-r border-white/[0.06] transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[272px]"
        }`}
        style={{ minHeight: "100dvh" }}
      >
        <div className="sticky top-0 flex h-screen flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          className="overlay-enter fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-full lg:hidden ${
          mobileOpen ? "sidebar-enter pointer-events-auto" : "pointer-events-none -translate-x-full"
        }`}
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <SidebarContent isMobile />
      </div>
    </>
  );
};

export default Sidebar;
