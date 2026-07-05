import { type CSSProperties } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import CustomTextarea from "../custom-tags/CustomTextArea";

type CustomTextareaFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: (value?: string) => void;
  onFocus?: (value?: string) => void;
  autoHeight?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  [key: string]: any;
};

const CustomTextareaField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  defaultValue = "",
  placeholder = "",
  className = "",
  onChange,
  onBlur,
  onFocus,
  autoHeight = false,
  disabled = false,
  style,
  ...rest
}: CustomTextareaFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue as any}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div>
          {label && (
            <label htmlFor={name} className="mb-2 block text-sm font-semibold text-[#0A1628]">
              {label}
              {rules.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
          )}

          <CustomTextarea
            {...rest}
            className={className}
            name={field.name}
            value={field.value}
            placeholder={placeholder}
            autoHeight={autoHeight}
            disabled={field.disabled || disabled}
            style={style}
            getInputRef={field.ref}
            onChange={(value) => {
              field.onChange(value);
              typeof onChange === "function" && onChange(value);
            }}
            onBlur={(value) => {
              field.onBlur();
              typeof onBlur === "function" && onBlur(value);
            }}
            onFocus={(value) => {
              typeof onFocus === "function" && onFocus(value);
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

export default CustomTextareaField;