import React from "react";
import type { FilterFieldDef } from "./types";
import { AutocompleteInput } from "./AutocompleteInput";

interface FilterValueInputProps {
  field: FilterFieldDef;
  value: string;
  onChange: (value: string) => void;
}

export const FilterValueInput = ({ field, value, onChange }: FilterValueInputProps) => {
  if (field.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full min-w-0 cursor-pointer appearance-none rounded-md border-0 bg-transparent px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-slate-100 focus:outline-none focus:ring-0"
      >
        <option value="" disabled>Select...</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "autocomplete" && field.fetchOptions) {
    return (
      <div className="w-full">
        <AutocompleteInput
          value={value}
          onChange={onChange}
          fetchOptions={field.fetchOptions}
          placeholder="Search..."
        />
      </div>
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value..."
      className="h-8 w-full min-w-0 rounded-md border-0 bg-transparent px-3 py-1 text-sm font-semibold text-blue-700 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
};
