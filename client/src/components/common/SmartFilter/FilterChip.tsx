import { XIcon } from "@phosphor-icons/react";
import type { FilterFieldDef, ActiveFilter } from "./types";
import { OPERATORS } from "./types";

interface FilterChipProps {
  filter: ActiveFilter;
  fields: FilterFieldDef[];
  onRemove: () => void;
  onClick?: () => void;
}

export const FilterChip = ({ filter, fields, onRemove, onClick }: FilterChipProps) => {
  const field = fields.find((f) => f.id === filter.fieldId) || {
    id: filter.fieldId,
    label: filter.fieldId,
    type: "text" as const,
  };

  const operatorList =
    field.operators || (OPERATORS[field.type as keyof typeof OPERATORS] ?? OPERATORS.text);
  const opObj = operatorList.find((o) => o.id === filter.operator);
  const opLabel = opObj ? opObj.label : filter.operator.toLowerCase();

  // Format display value:
  let displayValue = filter.value;
  if (field.type === "select" && field.options) {
    const optMatch = field.options.find((opt) =>
      typeof opt === "string" ? opt === filter.value : opt.value === filter.value
    );
    if (optMatch) {
      displayValue = typeof optMatch === "string" ? optMatch : optMatch.label;
    }
  }

  return (
    <div
      className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white pl-2.5 pr-1.5 py-1 text-xs text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50/70"
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 text-left focus:outline-none"
        title="Click to edit filter"
      >
        <span className="font-semibold text-slate-800">{field.label}</span>
        <span className="text-slate-400 font-normal">{opLabel}</span>
        <span className="font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 max-w-[140px] truncate">
          {displayValue || "(empty)"}
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-sm text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
        title="Remove filter"
        aria-label="Remove filter"
      >
        <XIcon size={11} weight="bold" />
      </button>
    </div>
  );
};
