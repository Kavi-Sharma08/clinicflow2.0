import type { AutocompleteOption } from "../../../types/doctorPortal.types";

export type FilterFieldType = "text" | "number" | "select" | "autocomplete";

export interface FilterFieldDef {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: string[]; // for static select options
  fetchOptions?: (query: string) => Promise<AutocompleteOption[]>; // for autocomplete
}

export interface ActiveFilter {
  id: string; // unique instance ID
  fieldId: string;
  operator: string;
  value: string;
}

export const OPERATORS = {
  text: [
    { id: "CONTAINS", label: "Contains" },
    { id: "DOES_NOT_CONTAIN", label: "Does Not Contain" },
    { id: "EQUALS", label: "Equals" },
    { id: "NOT_EQUALS", label: "Not Equals" },
    { id: "STARTS_WITH", label: "Starts With" },
    { id: "ENDS_WITH", label: "Ends With" },
  ],
  number: [
    { id: "EQUALS", label: "Equals" },
    { id: "NOT_EQUALS", label: "Not Equals" },
    { id: "GT", label: "Greater Than" },
    { id: "LT", label: "Less Than" },
  ],
  select: [
    { id: "EQUALS", label: "Is" },
    { id: "NOT_EQUALS", label: "Is Not" },
  ],
  autocomplete: [
    { id: "CONTAINS", label: "Contains" },
    { id: "EQUALS", label: "Equals" },
    { id: "DOES_NOT_CONTAIN", label: "Does Not Contain" },
  ],
};
