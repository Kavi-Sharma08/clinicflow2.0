import type { BloodGroup, DayOfWeek, DoctorDocumentType, EmploymentType } from "../../../../types/doctor.types";
import type { DoctorVerificationStatus } from "../../../../types/role.types";

export const formatEnumLabel = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatDate = (value: string | null): string => {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatAddress = (parts: Array<string | null>): string => {
  const address = parts.filter((part): part is string => Boolean(part && part.trim())).join(", ");
  return address || "Not provided";
};

export const statusLabel = (status: DoctorVerificationStatus): string =>
  status === "NOT_SUBMITTED" ? "Not Submitted" : formatEnumLabel(status);

export const employmentTypeLabel = (value: EmploymentType): string => formatEnumLabel(value);
export const bloodGroupLabel = (value: BloodGroup | null): string => (value ? formatEnumLabel(value).replace("Positive", "+").replace("Negative", "-") : "Not provided");
export const documentTypeLabel = (value: DoctorDocumentType): string => formatEnumLabel(value);
export const dayLabel = (value: DayOfWeek): string => formatEnumLabel(value);
