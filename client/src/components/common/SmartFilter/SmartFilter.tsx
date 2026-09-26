import React, { useState } from "react";
import { PlusIcon, FunnelIcon } from "@phosphor-icons/react";
import type { FilterFieldDef, ActiveFilter } from "./types";
import { FilterChip } from "./FilterChip";
import { FilterPopover } from "./FilterPopover";

export interface SmartFilterProps {
  fields: FilterFieldDef[];
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
  dateNode?: React.ReactNode;
  searchNode?: React.ReactNode;
  extraActions?: React.ReactNode;
  className?: string;
  maxVisibleChips?: number;
}

export const SmartFilter = ({
  fields,
  filters,
  onChange,
  dateNode,
  searchNode,
  extraActions,
  className = "",
  maxVisibleChips = 4,
}: SmartFilterProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRemove = (index: number) => {
    const next = filters.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const visibleFilters = isExpanded ? filters : filters.slice(0, maxVisibleChips);
  const hiddenCount = filters.length - maxVisibleChips;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs ${className}`}
    >
      {/* Left toolbar items */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Date picker slot */}
        {dateNode && <div className="shrink-0">{dateNode}</div>}

        {/* Search slot */}
        {searchNode && <div className="shrink-0">{searchNode}</div>}

        {/* Active Filter Chips */}
        {visibleFilters.map((filter, index) => (
          <FilterChip
            key={filter.id || `${filter.fieldId}-${index}`}
            filter={filter}
            fields={fields}
            onRemove={() => handleRemove(index)}
            onClick={() => setIsPopoverOpen(true)}
          />
        ))}

        {/* Overflow indicator if many filters */}
        {!isExpanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            +{hiddenCount} more
          </button>
        )}

        {isExpanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
          >
            Show less
          </button>
        )}

        {/* Popover trigger button (+ Filter) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition focus:outline-none ${
              isPopoverOpen || filters.length > 0
                ? "border-sky-300 bg-sky-50/70 text-sky-900 hover:bg-sky-100/80"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <PlusIcon size={13} weight="bold" />
            <span>Filter</span>
            {filters.length > 0 && (
              <span className="ml-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--color-primary-600)] px-1 text-[10px] font-bold text-white">
                {filters.length}
              </span>
            )}
          </button>

          <FilterPopover
            fields={fields}
            activeFilters={filters}
            isOpen={isPopoverOpen}
            onClose={() => setIsPopoverOpen(false)}
            onApply={(newFilters) => onChange(newFilters)}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Clear all action */}
        {filters.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 hover:underline focus:outline-none px-1 py-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Right actions slot */}
      {extraActions && <div className="shrink-0">{extraActions}</div>}
    </div>
  );
};
