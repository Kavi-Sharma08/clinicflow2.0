import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ListIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import Sidebar from "./Sidebar";
import Profile from "./Profile";
import NotificationsMenu from "./NotificationsMenu";

interface AppLayoutProps {
  /** Optional: override the background used in main content */
  bgClass?: string;
}

const AppLayout = ({ bgClass = "bg-[#f4f6fa]" }: AppLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`flex min-h-dvh ${bgClass}`}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ─── Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:px-6">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 lg:hidden"
          >
            <ListIcon size={18} />
          </button>

          {/* Search */}
          <div className="relative hidden flex-1 max-w-md md:block">
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
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
