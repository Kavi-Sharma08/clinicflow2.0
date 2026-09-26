import { CalendarBlankIcon } from "@phosphor-icons/react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  max?: string;
  min?: string;
  size?: "sm" | "md";
}

const DatePicker = ({
  value,
  onChange,
  label,
  required = false,
  error,
  className = "",
  disabled = false,
  max,
  min,
  size = "md",
}: DatePickerProps) => {
  const isSm = size === "sm";

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <CalendarBlankIcon
          className={`absolute ${isSm ? "left-2.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}
          size={isSm ? 14 : 18}
        />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          max={max}
          min={min}
          className={`${
            isSm
              ? "h-8.5 rounded-lg pl-8 pr-2.5 text-xs font-semibold text-slate-800"
              : "h-11 rounded-xl pl-10 pr-4 text-sm font-medium text-slate-900"
          } w-full cursor-pointer appearance-none border bg-white outline-none transition
            ${
              error
                ? "border-red-600 bg-red-50 focus:border-red-400"
                : "border-slate-200 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
            }
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:inset-0
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
          `}
        />
      </div>
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </div>
  );
};

export default DatePicker;
