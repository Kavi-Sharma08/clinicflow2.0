import type { GroupBase } from "react-select";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import useDebounce from "../../hooks/useDebounce";

const animatedComponents = makeAnimated();

type Option = { label: string; value: string };

type CustomAsyncSelectProps = {
  loadOptions: (query: string) => Promise<Option[]>;
  placeholder?: string;
  className?: string;
  onChange?: (value: Option | Option[] | null) => void;
  onBlur?: (e?: React.FocusEvent<HTMLInputElement>) => void;
  value?: Option | Option[] | null;
  disabled?: boolean;
  isMulti?: boolean;
  debounceMs?: number;
  defaultOptions?: boolean | Option[];
  cacheOptions?: boolean;
  [key: string]: any;
};

const CustomAsyncSelect = ({
  loadOptions,
  placeholder = "",
  className = "",
  onChange,
  onBlur,
  value,
  disabled = false,
  isMulti = false,
  debounceMs = 350,
  defaultOptions = true,
  cacheOptions = true,
  ...rest
}: CustomAsyncSelectProps) => {
    
  const debouncedLoad = useDebounce(
    (query: string, callback: (options: Option[]) => void) => {
      loadOptions(query)
        .then(callback)
        .catch(() => callback([]));
    },
    debounceMs
  );

  return (
    <AsyncSelect<Option, boolean, GroupBase<Option>>
      menuPosition="fixed"
      className={`asr-select-wrapper ${className}`}
      classNamePrefix="asr-select"
      value={value ?? (isMulti ? [] : null)}
      loadOptions={(inputValue, callback) => {
        debouncedLoad(inputValue, callback);
      }}
      defaultOptions={defaultOptions}
      cacheOptions={cacheOptions}
      placeholder={placeholder}
      components={animatedComponents}
      isMulti={isMulti}
      onChange={(value) => {
        typeof onChange === "function" && onChange(value as Option | Option[] | null);
      }}
      onBlur={(e) => {
        typeof onBlur === "function" && onBlur(e);
      }}
      isDisabled={disabled}
      {...rest}
    />
  );
};

export default CustomAsyncSelect;