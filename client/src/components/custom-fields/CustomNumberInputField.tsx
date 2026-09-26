import { type InputHTMLAttributes } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

type CustomNumberInputFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label: string;
  prefix?: React.ReactNode;
  onChange?: (value: number | "") => void;
  disabled?: boolean;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "onChange" | "disabled" | "type"
>;

const CustomNumberInputField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  prefix,
  className = "",
  onChange,
  disabled = false,
  ...rest
}: CustomNumberInputFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div>
          <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-700">
            {label}
            {rules.required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>

          <div className="relative flex items-center">
            {prefix && (
              <span className="pointer-events-none absolute left-3.5 text-sm font-semibold text-slate-500">
                {prefix}
              </span>
            )}

            <input
              {...field}
              {...rest}
              id={name}
              type="number"
              disabled={disabled}
              placeholder={rest.placeholder ?? `Enter ${label}`}
              value={field.value ?? ""}
              onChange={(e) => {
                const numValue = e.target.value === "" ? "" : e.target.valueAsNumber;
                field.onChange(numValue);
                typeof onChange === "function" && onChange(numValue);
              }}
              className={`w-full rounded-xl border bg-white h-11 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400
                ${prefix ? "pl-8" : ""}
                ${
                  error
                    ? "border-red-600 bg-red-50 focus:border-red-400"
                    : "border-slate-200 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                }
                disabled:bg-slate-50 disabled:text-slate-400
                ${className}
              `}
            />
          </div>

          {error && (
            <span className="mt-1 block text-xs text-red-600">{error.message}</span>
          )}
        </div>
      )}
    />
  );
};

export default CustomNumberInputField;