import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Outlet } from "react-router-dom";
import Profile from "../../common/Profile";
import Sidebar from "../../common/Sidebar";
import NotificationsMenu from "../../common/NotificationsMenu";

const Index = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <div className="relative hidden w-full max-w-xl md:block">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Search patients, appointments, schedules..."
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
<NotificationsMenu />
            <Profile />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Index;
