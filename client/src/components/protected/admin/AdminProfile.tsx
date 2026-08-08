import { useUser } from "../../../context/UserContext";
import { ShieldCheckIcon, UserCircleIcon, MailIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function AdminProfile() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <UserCircleIcon size={40} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">{user.fullName || "Administrator"}</h1>
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <MailIcon size={16} />
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
        <h2 className="text-lg font-bold text-slate-950">Account Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</p>
            <p className="mt-1 flex items-center gap-1.5 font-bold text-violet-700">
              <ShieldCheckIcon size={18} />
              Administrator
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security</p>
            <Link
              to="/admin/change-password"
              className="mt-1 inline-block text-sm font-bold text-blue-600 hover:underline"
            >
              Change Password →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
