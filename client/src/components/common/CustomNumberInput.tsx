import type { InputHTMLAttributes } from "react";

type CustomNumberInputProps = {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  error?: string;
  required?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "placeholder">;

const CustomNumberInput = ({
  label,
  value,
  onChange,
  error,
  required,
  ...rest
}: CustomNumberInputProps) => {
  const inputId = rest.id ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="relative">
      <input
        {...rest}
        id={inputId}
        type="number"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
        placeholder=" "
        className={`peer w-full rounded-lg border bg-white px-3 pt-5 pb-2 text-sm text-[#0A1628] outline-none transition
          ${
            error
              ? "border-red-600 bg-red-50 focus:border-red-400"
              : "border-[#d9e6f7] focus:border-[#0057A8] focus:ring-2 focus:ring-[#cfe5ff]"
          }
          ${rest.className ?? ""}
        `}
      />

      <label
        htmlFor={inputId}
        className={`pointer-events-none absolute left-3 bg-white px-1 text-sm font-medium transition-all duration-200
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#475569]
          peer-focus:-top-2.25 peer-focus:translate-y-0 peer-focus:text-xs
          peer-not-placeholder-shown:-top-2.25 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-[#6b7b94]
        `}
      >
        {label}
        {required && <span className="ml-0.5">*</span>}
      </label>

      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
  );
};

export default CustomNumberInput;