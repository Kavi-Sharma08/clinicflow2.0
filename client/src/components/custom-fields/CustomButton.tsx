import { type ButtonHTMLAttributes } from "react";

const VARIANT_STYLES = {
  primary: "bg-[#0057A8] text-white hover:bg-[#004f99]",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  outline: "border border-[#0057A8] text-[#0057A8] bg-transparent hover:bg-blue-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

type Variant = keyof typeof VARIANT_STYLES;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: Variant;
  fullWidth?: boolean;
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const CustomButton = ({
  children,
  loading = false,
  loadingText = "Loading...",
  variant = "primary",
  fullWidth = true,
  type = "button",
  disabled = false,
  className = "",
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        ${fullWidth ? "w-full" : ""} rounded-full py-2.5 text-sm font-semibold cursor-pointer
        transition disabled:opacity-70
        flex items-center justify-center gap-2
        ${VARIANT_STYLES[variant]}
        ${className}
      `}
      {...rest}
    >
      {loading && <Spinner />}
      {loading ? loadingText : children}
    </button>
  );
};

export default CustomButton;