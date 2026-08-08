import React from "react";
import type { FilterFieldDef } from "./types";

interface FilterFieldSelectProps {
  fields: FilterFieldDef[];
  value: string;
  onChange: (fieldId: string) => void;
}

export const FilterFieldSelect = ({ fields, value, onChange }: FilterFieldSelectProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-40 min-w-0 cursor-pointer appearance-none rounded-md border-0 bg-transparent px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-0"
    >
      <option value="" disabled>Select field...</option>
      {fields.map((field) => (
        <option key={field.id} value={field.id}>
          {field.label}
        </option>
      ))}
    </select>
  );
};
