import { CaretDownIcon } from "@phosphor-icons/react";
import type { FilterFieldDef } from "./types";

interface FilterFieldSelectProps {
  fields: FilterFieldDef[];
  value: string;
  onChange: (fieldId: string) => void;
  className?: string;
}

export const FilterFieldSelect = ({
  fields,
  value,
  onChange,
  className = "",
}: FilterFieldSelectProps) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8.5 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        <option value="" disabled>
          Select field...
        </option>
        {fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
      </select>
      <CaretDownIcon
        size={12}
        weight="bold"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
};
