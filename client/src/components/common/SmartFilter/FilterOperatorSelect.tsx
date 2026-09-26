import { CaretDownIcon } from "@phosphor-icons/react";
import { OPERATORS, type FilterFieldType } from "./types";

interface FilterOperatorSelectProps {
  fieldType: FilterFieldType;
  customOperators?: { id: string; label: string }[];
  value: string;
  onChange: (operator: string) => void;
  className?: string;
}

export const FilterOperatorSelect = ({
  fieldType,
  customOperators,
  value,
  onChange,
  className = "",
}: FilterOperatorSelectProps) => {
  const operators =
    customOperators || (OPERATORS[fieldType as keyof typeof OPERATORS] ?? OPERATORS.text);

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8.5 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {operators.map((op) => (
          <option key={op.id} value={op.id}>
            {op.label}
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
