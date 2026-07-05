import type { ReactNode } from "react";

export function InfoField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value || "Not provided"}</p>
    </div>
  );
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}
