import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <MagnifyingGlassIcon
        size={14}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8.5 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4.5 w-4.5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none transition"
          title="Clear search"
        >
          <XIcon size={12} weight="bold" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;