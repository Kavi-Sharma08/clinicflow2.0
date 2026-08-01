import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import CustomSelect from "../custom-tags/CustomSelect";

type Option = { label: string; value: string };
type SelectVariant = "form" | "compact";

type CustomSelectFieldProps<TFieldValues extends FieldValues, IsMulti extends boolean = false> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label?: string;
  options?: Option[];
  placeholder?: string;
  className?: string;
  defaultValue?: IsMulti extends true ? Option[] : Option | null;
  onChange?: (value: (IsMulti extends true ? Option[] : Option) | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  isMulti?: IsMulti;
  required?: boolean;
  variant?: SelectVariant;
  isSearchable?: boolean;
  isClearable?: boolean;
  [key: string]: any;
};

const CustomSelectField = <TFieldValues extends FieldValues, IsMulti extends boolean = false>({
  name,
  control,
  rules = {},
  label,
  options = [],
  placeholder = "",
  className = "",
  defaultValue,
  onChange,
  onBlur,
  disabled = false,
  isMulti,
  required = false,
  variant = "form",
  isSearchable,
  isClearable = false,
  ...rest
}: CustomSelectFieldProps<TFieldValues, IsMulti>) => {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={(defaultValue ?? (isMulti ? [] : null)) as any}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div className={className}>
          <CustomSelect
            {...rest}
            label={label}
            required={required}
            options={options}
            placeholder={placeholder}
            hasError={!!error}
            variant={variant}
            isMulti={isMulti}
            isSearchable={isSearchable}
            isClearable={isClearable}
            disabled={field.disabled || disabled}
            value={(field.value ?? (isMulti ? [] : null)) as any}
            onChange={(value) => {
              field.onChange(value);
              typeof onChange === "function" && onChange(value as any);
            }}
            onBlur={() => {
              field.onBlur();
              typeof onBlur === "function" && onBlur();
            }}
          />

          {error && (
            <span className="mt-1 block text-xs text-red-600">{error.message}</span>
          )}
        </div>
      )}
    />
  );
};

export default CustomSelectField;