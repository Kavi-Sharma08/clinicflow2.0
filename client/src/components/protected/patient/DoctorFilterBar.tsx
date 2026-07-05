import Dropdown from "../../common/Dropdown";
import SearchInput from "../../common/SearchInput";

export interface DoctorFilters {
  specialization: string | null;
  date: string | null;
  search: string;
}

interface DoctorFilterBarProps {
  filters: DoctorFilters;
  onChange: (filters: DoctorFilters) => void;
  specializations: string[];
  resultCount?: number;
}

const FilterBar = ({
  filters,
  onChange,
  specializations,
  resultCount,
}: DoctorFilterBarProps) => {
  const hasActiveFilters = Boolean(filters.specialization || filters.date);

  const clearAll = () => {
    onChange({ specialization: null, date: null, search: filters.search });
  };

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6b7b94]">
          {resultCount !== undefined
            ? `${resultCount} doctor${resultCount === 1 ? "" : "s"} available`
            : ""}
        </p>

        <div className="flex items-center gap-2">
          <SearchInput
            value={filters.search}
            onChange={(value) => onChange({ ...filters, search: value })}
            placeholder="Search doctors"
          />

          <Dropdown.Container>
            <Dropdown.Trigger>
              <span className="relative flex items-center gap-1.5 text-sm text-[#0A1628]">
                Filter
                {hasActiveFilters && (
                  <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-[#0057A8]" />
                )}
              </span>
            </Dropdown.Trigger>

            <Dropdown.Menu align="right">
              <div className="w-72 px-4 py-3">
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-[#6b7b94]">
                    Specialization
                  </label>
                  <select
                    value={filters.specialization ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        specialization: e.target.value || null,
                      })
                    }
                    className="w-full rounded-lg border border-[#d9e6f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">All specializations</option>
                    {specializations.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-[#6b7b94]">
                    Available on
                  </label>
                  <input
                    type="date"
                    value={filters.date ?? ""}
                    onChange={(e) =>
                      onChange({ ...filters, date: e.target.value || null })
                    }
                    className="w-full rounded-lg border border-[#d9e6f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-medium text-[#0057A8] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </Dropdown.Menu>
          </Dropdown.Container>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.specialization && (
            <span className="flex items-center gap-1.5 rounded-md bg-[#eaf2fd] px-2.5 py-1 text-xs font-medium text-[#0057A8]">
              {filters.specialization}
              <button
                type="button"
                aria-label="Remove specialization filter"
                onClick={() => onChange({ ...filters, specialization: null })}
              >
                ✕
              </button>
            </span>
          )}
          {filters.date && (
            <span className="flex items-center gap-1.5 rounded-md bg-[#eaf2fd] px-2.5 py-1 text-xs font-medium text-[#0057A8]">
              {new Date(filters.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              <button
                type="button"
                aria-label="Remove date filter"
                onClick={() => onChange({ ...filters, date: null })}
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;