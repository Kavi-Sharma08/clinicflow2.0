import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import CustomAsyncSelect from "../custom-tags/CustomAsyncSelect";

type Option = { label: string; value: string };

type CustomAsyncMultiSelectFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  loadOptions: (query: string) => Promise<Option[]>;
  placeholder?: string;
  className?: string;
  onChange?: (value: Option | Option[] | null) => void;
  disabled?: boolean;
  isMulti?: boolean;
  debounceMs?: number;
  [key: string]: any;
};

const CustomAsyncMultiSelectField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  loadOptions,
  placeholder = "",
  className = "",
  onChange,
  disabled = false,
  isMulti = false,
  debounceMs = 350,
  ...rest
}: CustomAsyncMultiSelectFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <>
          <CustomAsyncSelect
            loadOptions={loadOptions}
            placeholder={placeholder}
            className={className}
            debounceMs={debounceMs}
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

export default CustomAsyncMultiSelectField;