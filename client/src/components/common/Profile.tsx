import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useLogout } from "../../hooks/useLogout";
import useOutsideClick from "../common/OutsideClickHandler";

const PROFILE_ROUTES: Record<string, string> = {
  ADMIN: "/admin/profile",
  DOCTOR: "/doctor/profile",
  PATIENT: "/patient/profile",
};

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Profile() {
  const { user, loading } = useUser();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const menuRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));

  if (loading || !user) return null;

  const initials = getInitials(user.fullName, user.email);
  const displayName = user.fullName;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {displayName}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
          <button
            onClick={() => {
              setOpen(false);
              navigate(PROFILE_ROUTES[user.role] ?? "/");
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Profile
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/change-password");
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Change Password
          </button>
          <hr className="my-1 border-gray-100" />
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
