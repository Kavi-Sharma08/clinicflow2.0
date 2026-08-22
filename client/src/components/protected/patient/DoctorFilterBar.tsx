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
        <p className="text-xs font-semibold text-slate-500">
          {resultCount !== undefined
            ? `${resultCount} doctor${resultCount === 1 ? "" : "s"} available`
            : ""}
        </p>

        <div className="flex items-center gap-2">
          <SearchInput
            value={filters.search}
            onChange={(value) => onChange({ ...filters, search: value })}
            placeholder="Search doctors..."
          />

          <Dropdown.Container>
            <Dropdown.Trigger>
              <span className="relative flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                Filter
                {hasActiveFilters && (
                  <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-sky-600" />
                )}
              </span>
            </Dropdown.Trigger>

            <Dropdown.Menu align="right">
              <div className="w-64 p-3 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="">All specializations</option>
                    {specializations.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Available on
                  </label>
                  <input
                    type="date"
                    value={filters.date ?? ""}
                    onChange={(e) =>
                      onChange({ ...filters, date: e.target.value || null })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
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
            <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700">
              {filters.specialization}
              <button
                type="button"
                aria-label="Remove specialization filter"
                onClick={() => onChange({ ...filters, specialization: null })}
                className="hover:text-sky-900"
              >
                ✕
              </button>
            </span>
          )}
          {filters.date && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700">
              {new Date(filters.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              <button
                type="button"
                aria-label="Remove date filter"
                onClick={() => onChange({ ...filters, date: null })}
                className="hover:text-sky-900"
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