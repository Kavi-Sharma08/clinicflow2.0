import { useState, type KeyboardEvent } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { XIcon } from "@phosphor-icons/react";

type CustomTagInputFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
};

const CustomTagInputField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  placeholder = "Type and press Enter...",
  helperText = "Press Enter or comma to add",
  disabled = false,
}: CustomTagInputFieldProps<TFieldValues>) => {
  const [inputValue, setInputValue] = useState("");

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const tags: string[] = Array.isArray(field.value)
          ? (field.value as string[])
          : typeof field.value === "string" && (field.value as string).trim()
          ? (field.value as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];

        const addTag = (val: string) => {
          const trimmed = val.trim().replace(/^,|,$/g, "");
          if (!trimmed) return;
          const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
          if (!exists) {
            const next = [...tags, trimmed];
            field.onChange(next);
          }
          setInputValue("");
        };

        const removeTag = (indexToRemove: number) => {
          const next = tags.filter((_, idx) => idx !== indexToRemove);
          field.onChange(next);
        };

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(inputValue);
          } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            e.preventDefault();
            removeTag(tags.length - 1);
          }
        };

        return (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
                {label}
                {rules.required && <span className="ml-0.5 text-rose-500">*</span>}
              </label>
              {helperText && (
                <span className="text-[11px] text-slate-400">{helperText}</span>
              )}
            </div>

            <div
              className={`flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border bg-white p-2 transition
                ${
                  error
                    ? "border-red-600 bg-red-50 focus-within:border-red-400"
                    : "border-slate-200 focus-within:border-[var(--color-primary-600)] focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]"
                }
                ${disabled ? "bg-slate-50 cursor-not-allowed" : ""}
              `}
            >
              {tags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-800)] border border-[var(--color-primary-200)] shadow-2xs animate-in fade-in"
                >
                  <span>{tag}</span>
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() => removeTag(idx)}
                      className="rounded p-0.5 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-200)] hover:text-[var(--color-primary-900)] transition"
                    >
                      <XIcon size={12} weight="bold" />
                    </button>
                  )}
                </span>
              ))}

              <input
                id={name}
                type="text"
                value={inputValue}
                disabled={disabled}
                placeholder={tags.length === 0 ? placeholder : "Add another..."}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (inputValue.trim()) {
                    addTag(inputValue);
                  }
                }}
                className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-400"
              />
            </div>

            {error && (
              <span className="mt-1 block text-xs text-red-600">{error.message}</span>
            )}
          </div>
        );
      }}
    />
  );
};

export default CustomTagInputField;
