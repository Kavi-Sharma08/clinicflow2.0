import React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "booked"
  | "waiting"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "no_show"
  | "verified"
  | "pending"
  | "rejected";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200/80",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border border-rose-200/80",
  info: "bg-sky-50 text-sky-700 border border-sky-200/80",
  booked: "bg-sky-50 text-sky-700 border border-sky-200/80",
  waiting: "bg-amber-50 text-amber-700 border border-amber-200/80",
  in_consultation: "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200/80",
  no_show: "bg-slate-100 text-slate-600 border border-slate-200",
  verified: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  pending: "bg-amber-50 text-amber-700 border border-amber-200/80",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200/80",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  booked: "bg-sky-500",
  waiting: "bg-amber-500",
  in_consultation: "bg-emerald-500 animate-pulse",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
  no_show: "bg-slate-400",
  verified: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-rose-500",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
};

const Badge = ({ children, variant = "default", className = "", size = "md", dot = false }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 justify-center rounded-md font-semibold leading-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;

