import { Outlet } from "react-router-dom";
import { CommandIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import Sidebar from "../../common/Sidebar";
import Profile from "../../common/Profile";
import NotificationsMenu from "../../common/NotificationsMenu";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <div className="relative hidden w-full max-w-xl md:block">
              <MagnifyingGlassIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors, patients, appointments..."
                className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-400">
                <CommandIcon size={12} /> K
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
<NotificationsMenu />
              <Profile />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Index;
