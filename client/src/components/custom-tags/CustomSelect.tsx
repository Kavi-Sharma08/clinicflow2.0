import ReactSelect, { type StylesConfig } from "react-select";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

type SelectVariant = "form" | "compact";

const getSelectStyles = (hasError: boolean, variant: SelectVariant): StylesConfig<any, boolean> => {
  const isCompact = variant === "compact";

  return {
    container: (base) => ({ ...base, minWidth: isCompact ? 140 : "100%" }),
    control: (base, state) => ({
      ...base,
      minHeight: isCompact ? 36 : 46,
      borderRadius: isCompact ? 8 : 6,
      borderWidth: 1,
      borderColor: hasError ? "#dc2626" : state.isFocused ? "#0057A8" : "#e2e8f0",
      backgroundColor: hasError ? "#fef2f2" : "#ffffff",
      boxShadow: !isCompact && state.isFocused ? "0 0 0 2px #cfe5ff" : "none",
      cursor: "pointer",
      "&:hover": { borderColor: hasError ? "#dc2626" : "#0057A8" },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: isCompact ? "2px 10px" : base.padding,
    }),
    placeholder: (base) => ({ ...base, color: "#64748b", fontSize: isCompact ? 13 : 14 }),
    singleValue: (base) => ({ ...base, color: "#0A1628", fontSize: isCompact ? 13 : 14, fontWeight: isCompact ? 500 : 400 }),
    input: (base) => ({ ...base, color: "#0A1628", fontSize: isCompact ? 13 : 14, margin: 0 }),
    multiValue: (base) => ({ ...base, backgroundColor: "#e8f1fc", borderRadius: 4 }),
    multiValueLabel: (base) => ({ ...base, color: "#0057A8", fontWeight: 500, fontSize: 12 }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#0057A8",
      ":hover": { backgroundColor: "#0057A8", color: "#fff" },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      overflow: "hidden",
      zIndex: 50,
      minWidth: isCompact ? 160 : "100%",
    }),
    menuList: (base) => ({ ...base, maxHeight: 220, padding: 4 }),
    option: (base, state) => ({
      ...base,
      fontSize: isCompact ? 13 : 14,
      padding: isCompact ? "8px 10px" : "10px 16px",
      borderRadius: isCompact ? 6 : 0,
      backgroundColor: state.isSelected ? "#e8f1fc" : state.isFocused ? "#f0f7ff" : "#ffffff",
      color: state.isSelected ? "#0057A8" : "#0A1628",
      fontWeight: state.isSelected ? 500 : 400,
      cursor: "pointer",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({ ...base, color: "#94a3b8", padding: isCompact ? 6 : 8 }),
    clearIndicator: (base) => ({ ...base, color: "#94a3b8", padding: isCompact ? 6 : 8 }),
  };
};

type Option = { label: string; value: string };

type ValueOf<IsMulti extends boolean> = IsMulti extends true ? Option[] : Option;

type CustomSelectProps<IsMulti extends boolean = false> = {
  label?: string;
  options?: Option[];
  placeholder?: string;
  className?: string;
  onChange?: (value: ValueOf<IsMulti> | null) => void;
  onBlur?: (e?: any) => void;
  value?: ValueOf<IsMulti> | null;
  disabled?: boolean;
  isMulti?: IsMulti;
  hasError?: boolean;
  required?: boolean;
  variant?: SelectVariant;
  isSearchable?: boolean;
  isClearable?: boolean;
  [key: string]: any;
};

function CustomSelect<IsMulti extends boolean = false>({
  label,
  options = [],
  placeholder = "",
  className = "",
  onChange,
  onBlur,
  value ,
  disabled = false,
  isMulti,
  hasError = false,
  required = false,
  variant = "form",
  isSearchable,
  isClearable = false,
  ...rest
}: CustomSelectProps<IsMulti>) {
  const isCompact = variant === "compact";

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-[#0A1628]">
          {label}
          {required && <span className="ml-0.5">*</span>}
        </label>
      )}

      <ReactSelect
        menuPosition="fixed"
        menuPortalTarget={document.body}
        className={`asr-select-wrapper ${className}`}
        classNamePrefix="asr-select"
        value={(value ?? (isMulti ? [] : null)) as any}
        options={options}
        placeholder={placeholder}
        components={animatedComponents}
        isMulti={isMulti}
        isSearchable={isSearchable ?? !isCompact}
        isClearable={isClearable}
        styles={{
          ...getSelectStyles(hasError, variant),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        onBlur={onBlur}
        onChange={(value) => {
          typeof onChange === "function" && onChange(value as ValueOf<IsMulti> | null);
        }}
        isDisabled={disabled}
        {...rest}
      />
    </div>
  );
}

export default CustomSelect;