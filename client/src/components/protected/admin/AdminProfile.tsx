import { useUser } from "../../../context/UserContext";
import {
  ShieldCheckIcon,
  UserCircleIcon,
  EnvelopeIcon,
  LockKeyIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  KeyIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Badge from "../../common/Badge";

export default function AdminProfile() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-xl bg-slate-100 border border-slate-200" />
        <div className="h-64 rounded-xl bg-slate-100 border border-slate-200" />
      </div>
    );
  }

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <div className="space-y-5">
      {/* ─── Page Header / Identity Card ──────────────────────────────── */}
      <section className="cf-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 text-xl font-bold border border-violet-200 shadow-sm">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.fullName || "Admin"}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {user.fullName || "Administrator"}
                </h1>
                <Badge variant="verified" size="sm">
                  System Administrator
                </Badge>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <EnvelopeIcon size={14} className="text-slate-400" />
                {user.email}
              </p>
            </div>
          </div>

          <Link
            to="/admin/change-password"
            className="cf-btn-secondary text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
          >
            <LockKeyIcon size={15} /> Change Password
          </Link>
        </div>
      </section>

      {/* ─── Account Information ───────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="cf-card p-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Account Information
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Primary administrative credentials and access control.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Full Name
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {user.fullName || "Administrator"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Email Address
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{user.email}</p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System Role
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 font-bold text-violet-700 text-sm">
                <ShieldCheckIcon size={18} weight="duotone" />
                Administrator (Full Access)
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account ID
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-600 font-semibold">{user.id}</p>
            </div>
          </div>
        </section>

        {/* ─── Security & Platform Health ───────────────────────────────── */}
        <section className="cf-card p-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Security & Permissions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Authentication settings and administrative authority.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3.5">
              <CheckCircleIcon size={20} className="text-emerald-600 shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Email Verified & Active</p>
                <p className="mt-0.5 text-[11px] text-emerald-800">
                  Your administrative session has elevated permissions to review doctor applications, manage users, and inspect clinics.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyIcon size={18} className="text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Password & Authentication</p>
                    <p className="text-[11px] text-slate-500">Manage your secure password.</p>
                  </div>
                </div>
                <Link
                  to="/admin/change-password"
                  className="cf-btn-primary text-xs font-bold"
                >
                  Update
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

