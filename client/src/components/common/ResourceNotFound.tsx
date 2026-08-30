import { ArrowLeftIcon, FileSearchIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";

interface ResourceNotFoundProps {
  resourceName?: string;
  description?: string;
  backLink?: string;
  backText?: string;
}

export default function ResourceNotFound({
  resourceName = "Resource",
  description = "The item you requested does not exist or may have been deleted.",
  backLink,
  backText,
}: ResourceNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="cf-card p-8 text-center my-6 flex flex-col items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3">
        <FileSearchIcon size={24} weight="duotone" />
      </div>

      <h2 className="text-base font-bold text-slate-900">{resourceName} Not Found</h2>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>

      <div className="mt-4 flex items-center justify-center gap-2">
        {backLink ? (
          <Link to={backLink} className="cf-btn-primary text-xs font-bold">
            {backText || `Back to ${resourceName}s`}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="cf-btn-secondary text-xs font-semibold"
          >
            <ArrowLeftIcon size={13} /> Go Back
          </button>
        )}
      </div>
    </div>
  );
}
