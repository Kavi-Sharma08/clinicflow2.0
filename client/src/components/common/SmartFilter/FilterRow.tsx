import React from "react";
import { XIcon } from "@phosphor-icons/react";
import type { FilterFieldDef, ActiveFilter } from "./types";
import { OPERATORS } from "./types";
import { FilterFieldSelect } from "./FilterFieldSelect";
import { FilterOperatorSelect } from "./FilterOperatorSelect";
import { FilterValueInput } from "./FilterValueInput";

interface FilterRowProps {
  filter: ActiveFilter;
  fields: FilterFieldDef[];
  onChange: (updated: ActiveFilter) => void;
  onRemove: () => void;
}

export const FilterRow = ({ filter, fields, onChange, onRemove }: FilterRowProps) => {
  const selectedField = fields.find((f) => f.id === filter.fieldId);
  const defaultField = fields[0];
  const field = selectedField || defaultField;

  const handleFieldChange = (fieldId: string) => {
    const newField = fields.find((f) => f.id === fieldId);
    if (!newField) return;

    // When the field changes, reset operator to first valid operator for that type and clear value
    const firstOperator = OPERATORS[newField.type]?.[0]?.id || "EQUALS";
    onChange({ ...filter, fieldId, operator: firstOperator, value: "" });
  };

  const handleOperatorChange = (operator: string) => {
    onChange({ ...filter, operator });
  };

  const handleValueChange = (value: string) => {
    onChange({ ...filter, value });
  };

  return (
    <div className="group flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 transition hover:border-slate-300">
      {/* Field Select */}
      <div className="shrink-0 border-r border-slate-200">
        <FilterFieldSelect
          fields={fields}
          value={filter.fieldId}
          onChange={handleFieldChange}
        />
      </div>

      {/* Operator Select */}
      <div className="shrink-0 border-r border-slate-200">
        <FilterOperatorSelect
          fieldType={field.type}
          value={filter.operator}
          onChange={handleOperatorChange}
        />
      </div>

      {/* Value Input */}
      <div className="min-w-0 flex-1">
        <FilterValueInput
          field={field}
          value={filter.value}
          onChange={handleValueChange}
        />
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
        title="Remove filter"
      >
        <XIcon size={14} weight="bold" />
      </button>
    </div>
  );
};
