import React, { useEffect, useRef, type CSSProperties, type TextareaHTMLAttributes } from "react";

type CustomTextareaProps = {
  name?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoHeight?: boolean;
  style?: CSSProperties;
  onChange?: (value: string) => void;
  onBlur?: (value?: string) => void;
  onFocus?: (value?: string) => void;
  getInputRef?: React.Ref<HTMLTextAreaElement>;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name" | "value" | "onChange" | "onBlur" | "onFocus" | "disabled" | "style"
>;

const CustomTextarea = ({
  name,
  value = "",
  placeholder = "",
  className = "",
  disabled = false,
  autoHeight = false,
  style,
  onChange,
  onBlur,
  onFocus,
  getInputRef,
  ...rest
}: CustomTextareaProps) => {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  const setRefs = (node: HTMLTextAreaElement | null) => {
    internalRef.current = node;
    if (typeof getInputRef === "function") {
      getInputRef(node);
    } else if (getInputRef && typeof getInputRef === "object") {
      (getInputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }
  };

  const resize = () => {
    if (!autoHeight || !internalRef.current) return;
    internalRef.current.style.height = "auto";
    internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
  };
  
  useEffect(() => {
    resize();
  }, [value, autoHeight]);

  return (
    <textarea
      ref={setRefs}
      name={name}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      rows={rest.rows ?? 4}
      className={`w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none transition
        placeholder:text-slate-400
        focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-primary-100)]
        disabled:bg-slate-50 disabled:text-slate-400
        ${autoHeight ? "resize-none overflow-hidden" : "resize-y"}
        ${className}
      `}
      onChange={(e) => {
        typeof onChange === "function" && onChange(e.target.value);
        resize();
      }}
      onBlur={(e) => {
        typeof onBlur === "function" && onBlur(e.target.value);
      }}
      onFocus={(e) => {
        typeof onFocus === "function" && onFocus(e.target.value);
      }}
      {...rest}
    />
  );
};

export default CustomTextarea;