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
  leadingIcon?: React.ReactNode;
  floatingLabel?: boolean;
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
  leadingIcon,
  floatingLabel = true,
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
      render={({ field, fieldState: { error } }) => {
        if (!floatingLabel) {
          return (
            <div>
              <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-700">
                {label}
                {rules.required && <span className="ml-0.5 text-rose-500">*</span>}
              </label>

              <div className="relative">
                {leadingIcon && (
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {leadingIcon}
                  </div>
                )}

                <input
                  {...field}
                  {...rest}
                  id={name}
                  type={resolvedType}
                  placeholder={rest.placeholder}
                  disabled={disabled}
                  onChange={(e) => {
                    field.onChange(e);
                    typeof onChange === "function" && onChange(e.target.value);
                  }}
                  className={`w-full rounded-xl border bg-white h-11 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400
                    ${leadingIcon ? "pl-10" : ""}
                    ${isPassword ? "pr-10" : ""}
                    ${
                      error
                        ? "border-red-600 bg-red-50 focus:border-red-400"
                        : "border-slate-200 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                    }
                    ${className}
                  `}
                />

                {isPassword && (
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--color-primary-600)] transition"
                  >
                    {showPassword ? (
                      <EyeSlashIcon size={18} weight="bold" />
                    ) : (
                      <EyeIcon size={18} weight="bold" />
                    )}
                  </button>
                )}
              </div>

              {error && (
                <span className="mt-1 block text-xs text-red-600">{error.message}</span>
              )}
            </div>
          );
        }

        return (
          <div className="relative">
            {leadingIcon && (
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {leadingIcon}
              </div>
            )}

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
                ${leadingIcon ? "pl-10" : ""}
                ${isPassword ? "pr-10" : ""}
                ${
                  error
                    ? "border-red-600 bg-red-50 focus:border-red-400"
                    : "border-slate-200 focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                }
                ${className}
              `}
            />

            <label
              htmlFor={name}
              className={`pointer-events-none absolute bg-white px-1 font-medium transition-all duration-200
                ${leadingIcon ? "left-9.5 peer-focus:left-2.5 peer-not-placeholder-shown:left-2.5" : "left-2.5"}
                peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#475569]
                peer-focus:-top-2.25 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[var(--color-primary-700)]
                peer-not-placeholder-shown:-top-2.25 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-[#334155]
              `}
            >
              {label}
              {rules.required && <span className="ml-0.5 text-rose-500">*</span>}
            </label>

            {isPassword && (
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--color-primary-600)] transition"
              >
                {showPassword ? (
                  <EyeSlashIcon size={18} weight="bold" />
                ) : (
                  <EyeIcon size={18} weight="bold" />
                )}
              </button>
            )}

            {error && (
              <span className="mt-1 block text-xs text-red-600">{error.message}</span>
            )}
          </div>
        );
      }}
    />
  );
};

export default CustomInputField;