import { type ReactNode } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import CustomToggle from "../custom-tags/CustomToggle";

type CustomToggleFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label?: ReactNode;
  defaultValue?: boolean;
  className?: string;
  onChange?: (value: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  [key: string]: any;
};

const CustomToggleField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  defaultValue = false,
  className = "",
  onChange,
  onBlur,
  disabled = false,
  size = "md",
  ...rest
}: CustomToggleFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue as any}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div className={className}>
          <div className="flex items-center justify-between gap-3">
            {label && <div className="text-sm font-semibold text-[#0A1628]">{label}</div>}

            <CustomToggle
              {...rest}
              name={field.name}
              checked={!!field.value}
              disabled={field.disabled || disabled}
              size={size}
              onChange={(value) => {
                field.onChange(value);
                typeof onChange === "function" && onChange(value);
                field.onBlur();
                typeof onBlur === "function" && onBlur();
              }}
            />
          </div>

          {error && (
            <span className="mt-1 block text-xs text-red-600">{error.message}</span>
          )}
        </div>
      )}
    />
  );
};

export default CustomToggleField;