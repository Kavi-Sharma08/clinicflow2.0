import { useState, useEffect } from "react";
import { PlusIcon, XIcon, FunnelIcon } from "@phosphor-icons/react";
import type { FilterFieldDef, ActiveFilter } from "./types";
import { OPERATORS } from "./types";
import { FilterRow } from "./FilterRow";
import useOutsideClick from "../OutsideClickHandler";

interface FilterPopoverProps {
  fields: FilterFieldDef[];
  activeFilters: ActiveFilter[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ActiveFilter[]) => void;
  onClearAll: () => void;
}

export const FilterPopover = ({
  fields,
  activeFilters,
  isOpen,
  onClose,
  onApply,
  onClearAll,
}: FilterPopoverProps) => {
  const [draftFilters, setDraftFilters] = useState<ActiveFilter[]>([]);

  // Sync draft state when opened or activeFilters changes
  useEffect(() => {
    if (isOpen) {
      if (activeFilters.length > 0) {
        setDraftFilters([...activeFilters]);
      } else if (fields.length > 0) {
        // Auto-seed one initial rule
        const firstField = fields[0];
        const opList =
          firstField.operators ||
          (OPERATORS[firstField.type as keyof typeof OPERATORS] ?? OPERATORS.text);
        let initVal = "";
        if (firstField.type === "select" && firstField.options && firstField.options.length > 0) {
          const firstOpt = firstField.options[0];
          initVal = typeof firstOpt === "string" ? firstOpt : firstOpt.value;
        }

        setDraftFilters([
          {
            id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
            fieldId: firstField.id,
            operator: opList[0]?.id || "EQUALS",
            value: initVal,
          },
        ]);
      }
    }
  }, [isOpen, activeFilters, fields]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const popoverRef = useOutsideClick<HTMLDivElement>(() => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  const handleAddRule = () => {
    const defaultField = fields[0];
    if (!defaultField) return;

    const opList =
      defaultField.operators ||
      (OPERATORS[defaultField.type as keyof typeof OPERATORS] ?? OPERATORS.text);
    let initVal = "";
    if (defaultField.type === "select" && defaultField.options && defaultField.options.length > 0) {
      const firstOpt = defaultField.options[0];
      initVal = typeof firstOpt === "string" ? firstOpt : firstOpt.value;
    }

    setDraftFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
        fieldId: defaultField.id,
        operator: opList[0]?.id || "EQUALS",
        value: initVal,
      },
    ]);
  };

  const handleUpdateRow = (index: number, updated: ActiveFilter) => {
    setDraftFilters((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    setDraftFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    // Keep only rules with a value
    const valid = draftFilters.filter((f) => f.value.trim() !== "");
    onApply(valid);
    onClose();
  };

  const handleClear = () => {
    setDraftFilters([]);
    onClearAll();
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] sm:w-[520px] max-w-[560px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-900/5 transition-all animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <FunnelIcon size={14} weight="bold" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Filter Rules</h4>
            <p className="text-[11px] text-slate-500">Apply multiple conditions to refine data</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
        >
          <XIcon size={14} weight="bold" />
        </button>
      </div>

      {/* Rules list */}
      <div className="my-3 max-h-[320px] overflow-y-auto space-y-2.5 pr-1">
        {draftFilters.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No filter rules yet. Click below to add one.
          </div>
        ) : (
          draftFilters.map((filter, index) => (
            <div key={filter.id} className="space-y-2">
              {index > 0 && (
                <div className="flex items-center gap-2 py-0.5">
                  <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    AND
                  </span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>
              )}
              <FilterRow
                filter={filter}
                fields={fields}
                onChange={(updated) => handleUpdateRow(index, updated)}
                onRemove={() => handleRemoveRow(index)}
                canRemove={draftFilters.length > 1}
              />
            </div>
          ))
        )}

        <button
          type="button"
          onClick={handleAddRule}
          className="mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus:outline-none"
        >
          <PlusIcon size={13} weight="bold" />
          Add filter
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 hover:underline focus:outline-none"
        >
          Clear all
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-[var(--color-primary-600)] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--color-primary-700)] focus:outline-none"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
