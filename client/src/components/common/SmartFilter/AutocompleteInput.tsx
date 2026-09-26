import { useState, useEffect, useRef } from "react";
import useOutsideClick from "../OutsideClickHandler";
import type { AutocompleteOption } from "../../../types/doctorPortal.types";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  fetchOptions: (query: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  className?: string;
}

export const AutocompleteInput = ({
  value,
  onChange,
  fetchOptions,
  placeholder = "Search...",
  className = "",
}: AutocompleteInputProps) => {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerRef = useOutsideClick<HTMLDivElement>(() => {
    setIsOpen(false);
    setQuery(value);
  });

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchOptions(query).then((res) => {
        setOptions(res || []);
        setIsLoading(false);
      }).catch(() => {
        setOptions([]);
        setIsLoading(false);
      });
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, fetchOptions]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.label);
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <input
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="h-8.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full min-w-[200px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-slate-400">Loading suggestions...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No matches found</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full truncate rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-900 focus:bg-sky-50 focus:outline-none transition"
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
