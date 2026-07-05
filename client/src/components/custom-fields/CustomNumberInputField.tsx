import { type InputHTMLAttributes } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

type CustomNumberInputFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label: string;
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
          <label htmlFor={name} className="mb-2 block text-sm font-semibold text-[#0A1628]">
            {label}
            {rules.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>

          <input
            {...field}
            {...rest}
            id={name}
            type="number"
            disabled={disabled}
            placeholder={rest.placeholder ?? `Enter ${label}`}
            onChange={(e) => {
              const numValue = e.target.value === "" ? "" : e.target.valueAsNumber;
              field.onChange(numValue);
              typeof onChange === "function" && onChange(numValue);
            }}
            className={`w-full rounded-md border border-[#d9e6f7] bg-white px-3 py-3 text-sm text-[#0A1628] outline-none transition
              placeholder:text-[#94a3b8]
              focus:border-[#0057A8] focus:ring-2 focus:ring-[#cfe5ff]
              disabled:bg-gray-50 disabled:text-gray-400
              ${className}
            `}
          />

          {error && (
            <span className="mt-1 block text-xs text-red-600">{error.message}</span>
          )}
        </div>
      )}
    />
  );
};

export default CustomNumberInputField;