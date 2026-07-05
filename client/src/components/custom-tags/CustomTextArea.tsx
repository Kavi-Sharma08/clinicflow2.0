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
      className={`w-full rounded-md border border-[#d9e6f7] bg-white px-3 py-3 text-sm text-[#0A1628] outline-none transition
        placeholder:text-[#94a3b8]
        focus:border-[#0057A8] focus:ring-2 focus:ring-[#cfe5ff]
        disabled:bg-gray-50 disabled:text-gray-400
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