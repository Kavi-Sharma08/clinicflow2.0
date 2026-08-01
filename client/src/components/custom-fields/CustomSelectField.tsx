import { Controller, type Control, type FieldValues, type Path, type RegisterOptions } from "react-hook-form";
import CustomSelect from "../custom-tags/CustomSelect";

type Option = { label: string; value: string };
type SelectVariant = "form" | "compact";

type CustomSelectFieldProps<TFieldValues extends FieldValues, IsMulti extends boolean = false> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  label?: string;
  options?: Option[];
  placeholder?: string;
  className?: string;
  onChange?: (value: string | Option[] | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  isMulti?: IsMulti;
  required?: boolean;
  variant?: SelectVariant;
  isSearchable?: boolean;
  isClearable?: boolean;
};

const CustomSelectField = <TFieldValues extends FieldValues, IsMulti extends boolean = false>({
  name,
  control,
  rules = {},
  label,
  options = [],
  placeholder = "",
  className = "",
  onChange,
  onBlur,
  disabled = false,
  isMulti,
  required = false,
  variant = "form",
  isSearchable,
  isClearable = false,
}: CustomSelectFieldProps<TFieldValues, IsMulti>) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        /**
         * Derive the value prop for react-select:
         * - Single: field.value is a string → find the matching Option object (or null)
         * - Multi: field.value is Option[] → pass through as-is
         */
        const selectValue = isMulti
          ? (field.value as Option[] | undefined) ?? []
          : options.find((opt) => opt.value === field.value) ?? null;

        return (
          <div className={className}>
            <CustomSelect
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
              value={selectValue}
              onChange={(selected) => {
                if (isMulti) {
                  // Multi-select: store the full Option[] (react-select needs objects for display)
                  field.onChange(selected);
                  onChange?.(selected as Option[] | null);
                } else {
                  // Single-select: store only the string value — this is what backends expect.
                  const stringValue = (selected as Option | null)?.value ?? null;
                  field.onChange(stringValue);
                  onChange?.(stringValue);
                }
              }}
              onBlur={() => {
                field.onBlur();
                onBlur?.();
              }}
            />

            {error && (
              <span className="mt-1 block text-xs text-red-600">{error.message}</span>
            )}
          </div>
        );
      }}
    />
  );
};

export default CustomSelectField;