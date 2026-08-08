import React from "react";
import { OPERATORS, type FilterFieldType } from "./types";

interface FilterOperatorSelectProps {
  fieldType: FilterFieldType;
  value: string;
  onChange: (operator: string) => void;
}

export const FilterOperatorSelect = ({ fieldType, value, onChange }: FilterOperatorSelectProps) => {
  const operators = OPERATORS[fieldType] || OPERATORS.text;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-32 min-w-0 cursor-pointer appearance-none rounded-md border-0 bg-transparent px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-0"
    >
      {operators.map((op) => (
        <option key={op.id} value={op.id}>
          {op.label}
        </option>
      ))}
    </select>
  );
};
