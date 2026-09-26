import type { AutocompleteOption } from "../../../types/doctorPortal.types";

export type FilterFieldType = "text" | "number" | "select" | "autocomplete" | "date";

export interface FilterSelectOption {
  label: string;
  value: string;
}

export interface FilterFieldDef {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: (FilterSelectOption | string)[]; // for static select options
  placeholder?: string;
  fetchOptions?: (query: string) => Promise<AutocompleteOption[]>; // for autocomplete
  operators?: { id: string; label: string }[];
}

export interface ActiveFilter {
  id: string; // unique instance ID
  fieldId: string;
  operator: string;
  value: string;
}

export const OPERATORS = {
  text: [
    { id: "CONTAINS", label: "contains" },
    { id: "DOES_NOT_CONTAIN", label: "does not contain" },
    { id: "EQUALS", label: "equals" },
    { id: "NOT_EQUALS", label: "not equals" },
    { id: "STARTS_WITH", label: "starts with" },
    { id: "ENDS_WITH", label: "ends with" },
  ],
  number: [
    { id: "EQUALS", label: "equals" },
    { id: "NOT_EQUALS", label: "not equals" },
    { id: "GT", label: ">" },
    { id: "LT", label: "<" },
  ],
  select: [
    { id: "EQUALS", label: "is" },
    { id: "NOT_EQUALS", label: "is not" },
  ],
  autocomplete: [
    { id: "CONTAINS", label: "contains" },
    { id: "EQUALS", label: "equals" },
    { id: "DOES_NOT_CONTAIN", label: "does not contain" },
  ],
  date: [
    { id: "EQUALS", label: "is" },
    { id: "BEFORE", label: "is before" },
    { id: "AFTER", label: "is after" },
  ],
};
