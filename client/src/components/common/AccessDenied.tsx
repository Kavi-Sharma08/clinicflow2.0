import { ShieldWarningIcon, ArrowLeftIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function AccessDenied() {
  const { user } = useUser();
  const navigate = useNavigate();

  const dashboardPath = user
    ? user.role === "ADMIN"
      ? "/admin"
      : user.role === "DOCTOR"
      ? `/doctor/dashboard/${user.id}`
      : `/patient/dashboard/${user.id}`
    : "/login";

  const roleName = user
    ? user.role === "ADMIN"
      ? "Admin Dashboard"
      : user.role === "DOCTOR"
      ? "Doctor Dashboard"
      : "Patient Dashboard"
    : "Login";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm mb-4">
        <ShieldWarningIcon size={32} weight="duotone" />
      </div>

      <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
        403 — Access Restricted
      </span>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        You don't have permission to access this area
      </h1>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
        This section is restricted to specific user roles. Your current account ({user?.role?.toLowerCase() || "guest"}) does not have administrative or required privileges for this page.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cf-btn-secondary text-xs font-semibold"
        >
          <ArrowLeftIcon size={14} /> Go Back
        </button>
        <Link to={dashboardPath} className="cf-btn-primary text-xs font-bold">
          <SquaresFourIcon size={14} /> Return to {roleName}
        </Link>
      </div>
    </div>
  );
}
