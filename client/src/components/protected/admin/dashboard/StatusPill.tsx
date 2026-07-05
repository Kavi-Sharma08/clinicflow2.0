const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-600",
  Pending: "bg-amber-50 text-amber-600",
  "Walk-in": "bg-sky-50 text-sky-600",
  Cancelled: "bg-rose-50 text-rose-600",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}