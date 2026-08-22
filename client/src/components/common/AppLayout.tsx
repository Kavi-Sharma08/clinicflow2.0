import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ListIcon } from "@phosphor-icons/react";
import Sidebar from "./Sidebar";
import Profile from "./Profile";
import NotificationsMenu from "./NotificationsMenu";
import { useUser } from "../../context/UserContext";

interface AppLayoutProps {
  /** Optional: override the background used in main content */
  bgClass?: string;
}

const getPageContext = (pathname: string, role?: string) => {
  if (pathname.includes("/book")) return { section: "Patient Portal", title: "Find Doctors & Book" };
  if (pathname.includes("/appointments")) return { section: role === "DOCTOR" ? "Doctor Portal" : "Patient Portal", title: role === "DOCTOR" ? "Live Queue & Schedule" : "My Appointments" };
  if (pathname.includes("/availability")) return { section: "Doctor Portal", title: "Availability & Slots" };
  if (pathname.includes("/profile")) return { section: "Account", title: "My Profile" };
  if (pathname.includes("/admin/doctors")) return { section: "Admin Portal", title: "Doctor Management" };
  if (pathname.includes("/admin/users")) return { section: "Admin Portal", title: "User Directory" };
  if (pathname.includes("/admin")) return { section: "Admin Portal", title: "Enterprise Dashboard" };
  return { section: "ClinicFlow", title: "Overview" };
};

const AppLayout = ({ bgClass = "bg-[#f8fafc]" }: AppLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const context = getPageContext(location.pathname, user?.role);

  return (
    <div className={`flex min-h-dvh ${bgClass}`}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ─── Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            >
              <ListIcon size={16} />
            </button>

            {/* Context breadcrumb / Page indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">{context.section}</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-900">{context.title}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <NotificationsMenu />
            <Profile />
          </div>
        </header>

        {/* ─── Main Content ────────────────────────────────────── */}
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

