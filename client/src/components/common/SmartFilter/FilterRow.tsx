import { TrashIcon } from "@phosphor-icons/react";
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
  canRemove?: boolean;
}

export const FilterRow = ({
  filter,
  fields,
  onChange,
  onRemove,
  canRemove = true,
}: FilterRowProps) => {
  const selectedField = fields.find((f) => f.id === filter.fieldId) || fields[0];
  const field = selectedField || {
    id: filter.fieldId,
    label: filter.fieldId,
    type: "text" as const,
  };

  const handleFieldChange = (fieldId: string) => {
    const newField = fields.find((f) => f.id === fieldId);
    if (!newField) return;

    const opList =
      newField.operators || (OPERATORS[newField.type as keyof typeof OPERATORS] ?? OPERATORS.text);
    const firstOperator = opList[0]?.id || "EQUALS";

    let initialValue = "";
    if (newField.type === "select" && newField.options && newField.options.length > 0) {
      const firstOpt = newField.options[0];
      initialValue = typeof firstOpt === "string" ? firstOpt : firstOpt.value;
    }

    onChange({
      ...filter,
      fieldId,
      operator: firstOperator,
      value: initialValue,
    });
  };

  const handleOperatorChange = (operator: string) => {
    onChange({ ...filter, operator });
  };

  const handleValueChange = (value: string) => {
    onChange({ ...filter, value });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      {/* Field selector */}
      <div className="w-full sm:w-36 shrink-0">
        <FilterFieldSelect
          fields={fields}
          value={filter.fieldId}
          onChange={handleFieldChange}
          className="w-full"
        />
      </div>

      {/* Operator selector */}
      <div className="w-full sm:w-32 shrink-0">
        <FilterOperatorSelect
          fieldType={field.type}
          customOperators={field.operators}
          value={filter.operator}
          onChange={handleOperatorChange}
          className="w-full"
        />
      </div>

      {/* Value input */}
      <div className="min-w-0 flex-1">
        <FilterValueInput
          field={field}
          value={filter.value}
          onChange={handleValueChange}
          className="w-full"
        />
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none"
          title="Remove filter rule"
        >
          <TrashIcon size={14} />
        </button>
      )}
    </div>
  );
};
