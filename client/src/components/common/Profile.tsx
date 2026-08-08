import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  LockKeyIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useUser } from "../../context/UserContext";
import { useLogout } from "../../hooks/useLogout";
import useOutsideClick from "../common/OutsideClickHandler";

function getProfileRoute(role: string, userId: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/profile";
    case "DOCTOR":
      return "/doctor/profile";
    case "PATIENT":
      return `/patient/dashboard/${userId}/profile`;
    default:
      return "/";
  }
}

function getPasswordRoute(role: string, userId: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/change-password";
    case "DOCTOR":
      return "/doctor/profile/change-password";
    case "PATIENT":
      return `/patient/dashboard/${userId}/change-password`;
    default:
      return "/";
  }
}

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-600",
  DOCTOR: "bg-emerald-600",
  PATIENT: "bg-blue-600",
};

export default function Profile() {
  const { user, loading } = useUser();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const menuRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));

  if (loading || !user) return null;

  const initials = getInitials(user.fullName, user.email);
  const avatarColor = ROLE_COLORS[user.role] ?? "bg-blue-600";

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="profile-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${avatarColor} text-[11px] font-bold text-white`}
        >
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 sm:block">
          {user.fullName?.split(" ")[0] ?? user.role}
        </span>
        <CaretDownIcon
          size={14}
          weight="bold"
          className={`hidden text-slate-400 transition-transform duration-150 sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="dropdown-enter absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10"
        >
          {/* User info */}
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.fullName ?? "ClinicFlow User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(getProfileRoute(user.role, user.id));
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <UserCircleIcon size={16} className="text-slate-400" />
              My Profile
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(getPasswordRoute(user.role, user.id));
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <LockKeyIcon size={16} className="text-slate-400" />
              Change Password
            </button>
          </div>

          <div className="border-t border-slate-100 p-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <ArrowSquareOutIcon size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
