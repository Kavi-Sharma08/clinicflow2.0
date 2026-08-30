import { ArrowLeftIcon, SquaresFourIcon, QuestionMarkIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function AuthenticatedNotFound() {
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
    : "Dashboard";

  return (
    <div className="cf-card p-10 text-center my-6 flex flex-col items-center justify-center min-h-[400px]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm mb-3.5">
        <QuestionMarkIcon size={28} weight="bold" />
      </div>

      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">
        Page Not Found
      </span>

      <h1 className="mt-2.5 text-lg font-bold tracking-tight text-slate-900">
        We couldn't find the requested page
      </h1>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
        The link you followed may be incorrect, or the page may have been moved or is no longer accessible within your workspace.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cf-btn-secondary text-xs font-semibold"
        >
          <ArrowLeftIcon size={14} /> Back
        </button>
        <Link to={dashboardPath} className="cf-btn-primary text-xs font-bold">
          <SquaresFourIcon size={14} /> {roleName}
        </Link>
      </div>
    </div>
  );
}
