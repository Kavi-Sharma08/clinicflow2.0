import { useState, type InputHTMLAttributes } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

type CustomInputFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "onChange" | "disabled" | "type"
> & { type?: InputHTMLAttributes<HTMLInputElement>["type"] };

const CustomInputField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  type = "text",
  className = "",
  onChange,
  disabled = false,
  ...rest
}: CustomInputFieldProps<TFieldValues>) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div className="relative">
          <input
            {...field}
            {...rest}
            id={name}
            type={resolvedType}
            placeholder=" "
            disabled={disabled}
            onChange={(e) => {
              field.onChange(e);
              typeof onChange === "function" && onChange(e.target.value);
            }}
            className={`peer w-full rounded-lg border bg-white px-3 pt-5 pb-2 text-sm text-[#0A1628] outline-none transition
              ${isPassword ? "pr-10" : ""}
              ${
                error
                  ? "border-red-600 bg-red-50 focus:border-red-400"
                  : "border-[#d9e6f7] focus:border-[#0057A8] focus:ring-2 focus:ring-[#cfe5ff]"
              }
              ${className}
            `}
          />

          <label
            htmlFor={name}
            className={`pointer-events-none absolute left-3 bg-white px-1 text-sm font-medium transition-all duration-200
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#475569]
              peer-focus:-top-2.25 peer-focus:translate-y-0 peer-focus:text-xs
              peer-not-placeholder-shown:-top-2.25 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-[#6b7b94]
            `}
          >
            {label}
            {rules.required && <span className="ml-0.5">*</span>}
          </label>

          {isPassword && (
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aafc9] hover:text-[#0057A8] transition"
            >
              {showPassword ? (
                <EyeSlashIcon size={16} weight="bold" />
              ) : (
                <EyeIcon size={16} weight="bold" />
              )}
            </button>
          )}

          {error && (
            <span className="mt-1 block text-xs text-red-600">{error.message}</span>
          )}
        </div>
      )}
    />
  );
};

export default CustomInputField;