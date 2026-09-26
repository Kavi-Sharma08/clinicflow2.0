import { CaretDownIcon } from "@phosphor-icons/react";
import type { FilterFieldDef } from "./types";
import { AutocompleteInput } from "./AutocompleteInput";

interface FilterValueInputProps {
  field: FilterFieldDef;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FilterValueInput = ({
  field,
  value,
  onChange,
  className = "",
}: FilterValueInputProps) => {
  if (field.type === "select") {
    return (
      <div className={`relative inline-block w-full ${className}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8.5 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-sky-800 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="" disabled>
            Select {field.label.toLowerCase()}...
          </option>
          {field.options?.map((opt) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>
        <CaretDownIcon
          size={12}
          weight="bold"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    );
  }

  if (field.type === "autocomplete" && field.fetchOptions) {
    return (
      <AutocompleteInput
        value={value}
        onChange={onChange}
        fetchOptions={field.fetchOptions}
        placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
        className={className}
      />
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${className}`}
      />
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
      className={`h-8.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${className}`}
    />
  );
};
