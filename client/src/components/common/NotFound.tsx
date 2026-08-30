import { ArrowLeftIcon, HouseIcon, QuestionMarkIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";

interface NotFoundProps {
  title?: string;
  description?: string;
  homeLink?: string;
  homeText?: string;
}

export default function NotFound({
  title = "Page not found",
  description = "The page you are looking for doesn't exist, has been removed, or the link may be broken.",
  homeLink = "/",
  homeText = "Go to Home",
}: NotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm mb-4">
        <QuestionMarkIcon size={32} weight="bold" />
      </div>

      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">
        404 Error
      </span>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cf-btn-secondary text-xs font-semibold"
        >
          <ArrowLeftIcon size={14} /> Go Back
        </button>
        <Link to={homeLink} className="cf-btn-primary text-xs font-bold">
          <HouseIcon size={14} /> {homeText}
        </Link>
      </div>
    </div>
  );
}
