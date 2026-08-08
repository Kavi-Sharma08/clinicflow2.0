import React, { useState, useEffect, useRef } from "react";
import useOutsideClick from "../OutsideClickHandler";
import type { AutocompleteOption } from "../../../types/doctorPortal.types";

interface AutocompleteInputProps {
  value: string; // The display label or ID depending on usage. We use label for simplicity here.
  onChange: (value: string) => void;
  fetchOptions: (query: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
}

export const AutocompleteInput = ({ value, onChange, fetchOptions, placeholder = "Search..." }: AutocompleteInputProps) => {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();

  const containerRef = useOutsideClick<HTMLDivElement>(() => {
    setIsOpen(false);
    setQuery(value); // Reset query to selected value if click outside without selecting
  });

  // Sync internal query if external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchOptions(query).then((res) => {
        setOptions(res);
        setIsLoading(false);
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, fetchOptions]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.label); // We filter on the label text
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-md border-0 bg-transparent px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
      />

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-slate-400">Loading...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No matches found</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className="w-full truncate rounded-md px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
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
