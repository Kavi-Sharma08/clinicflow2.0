import type { ReactNode } from "react";
import { ClockUserIcon } from "@phosphor-icons/react";

interface AdminPlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

const AdminPlaceholder = ({ title, description, icon }: AdminPlaceholderProps) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex w-full max-w-lg flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100">
          {icon || <ClockUserIcon size={32} weight="duotone" />}
        </div>
        
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
          Coming Soon
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          {description}
        </p>

        <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">What to expect</h3>
          <ul className="mt-4 space-y-3 text-left">
            {[
              "Enterprise-grade performance and reliability",
              "Real-time synchronization across all roles",
              "Comprehensive audit logs and tracking",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
