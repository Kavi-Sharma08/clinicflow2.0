import CreatableSelect from "react-select/creatable";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

type SelectOption = {
  label: string;
  value: string;
};

type CustomMultiCreatableSelectProps = {
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  onChange?: (value: unknown) => void;
  onBlur?: (event: unknown) => void;
  value?: unknown;
  disabled?: boolean;
  isMulti?: boolean;
};

const CustomMultiCreatableSelect = ({
  options = [],
  placeholder = "",
  className = "",
  onChange,
  onBlur,
  value,
  disabled = false,
  isMulti = true,
}: CustomMultiCreatableSelectProps) => {
  return (
    <CreatableSelect
      menuPosition="fixed"
      className={`asr-select-wrapper ${className}`}
      classNamePrefix="asr-select"
      value={value ?? (isMulti ? [] : null)}
      options={options}
      placeholder={placeholder}
      components={animatedComponents}
      isMulti={isMulti}
      onChange={(nextValue) => {
        onChange?.(nextValue);
      }}
      onBlur={(event) => {
        onBlur?.(event);
      }}
      isDisabled={disabled}
    />
  );
};

export default CustomMultiCreatableSelect;
