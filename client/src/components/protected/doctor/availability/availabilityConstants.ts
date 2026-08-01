import type { DayOfWeek } from "../../../../types/doctorPortal.types";

/** Ordered list of weekdays (Mon → Sun) — matches backend enum ordering. */
export const ORDERED_DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/** Human-readable labels for each weekday. */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

/** Short labels for compact display. */
export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

/** Options array for react-select day dropdowns. */
export const DAY_OPTIONS = ORDERED_DAYS.map((day) => ({
  label: DAY_LABELS[day],
  value: day,
}));

/**
 * Formats a 24-hour "HH:MM" time string to a human-readable 12-hour format.
 * e.g. "14:00" → "2:00 PM", "09:30" → "9:30 AM"
 */
export const formatTime = (time: string): string => {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr ?? "0", 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
};

/** Default form values for both create and edit forms. */
export const DEFAULT_AVAILABILITY_FORM_VALUES = {
  dayOfWeek: "" as const,
  startTime: "09:00",
  endTime: "17:00",
  maxAppointments: 10 as const,
  isAvailable: true,
};
