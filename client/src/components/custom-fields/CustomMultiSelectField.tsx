import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import CustomSelect from "../custom-tags/CustomSelect";

type Option = { label: string; value: string };

type CustomMultiSelectFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label?: string;
  options?: Option[];
  placeholder?: string;
  className?: string;
  onChange?: (value: Option | Option[] | null) => void;
  disabled?: boolean;
  isMulti?: boolean;
  [key: string]: any;
};

const CustomMultiSelectField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  options = [],
  placeholder = "",
  className = "",
  onChange,
  disabled = false,
  isMulti = false,
  ...rest
}: CustomMultiSelectFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <>
          <CustomSelect
            label={label}
            options={options}
            placeholder={placeholder}
            className={className}
            hasError={!!error}
            required={!!rules.required}
            {...field}
            onChange={(value) => {
              field.onChange(value);
              typeof onChange === "function" && onChange(value);
            }}
            disabled={disabled}
            isMulti={isMulti}
            {...rest}
          />
          {error && (
            <span className="mt-1 block text-xs text-red-600">{error.message}</span>
          )}
        </>
      )}
    />
  );
};

export default CustomMultiSelectField;