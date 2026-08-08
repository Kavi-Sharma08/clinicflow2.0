import React from "react";
import { PlusIcon, FadersIcon } from "@phosphor-icons/react";
import type { FilterFieldDef, ActiveFilter } from "./types";
import { OPERATORS } from "./types";
import { FilterRow } from "./FilterRow";

interface SmartFilterProps {
  fields: FilterFieldDef[];
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

export const SmartFilter = ({ fields, filters, onChange }: SmartFilterProps) => {
  const handleAdd = () => {
    const defaultField = fields[0];
    if (!defaultField) return;

    const firstOperator = OPERATORS[defaultField.type]?.[0]?.id || "EQUALS";

    onChange([
      ...filters,
      {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
        fieldId: defaultField.id,
        operator: firstOperator,
        value: "",
      },
    ]);
  };

  const handleUpdate = (index: number, updated: ActiveFilter) => {
    const next = [...filters];
    next[index] = updated;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Applied filter rows */}
      {filters.map((filter, index) => (
        <FilterRow
          key={filter.id}
          filter={filter}
          fields={fields}
          onChange={(updated) => handleUpdate(index, updated)}
          onRemove={() => handleRemove(index)}
        />
      ))}

      {/* Add filter button */}
      <button
        onClick={handleAdd}
        className="flex h-8 items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-3 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
      >
        <PlusIcon size={14} weight="bold" />
        Add filter
      </button>
    </div>
  );
};
