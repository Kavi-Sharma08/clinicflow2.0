import { useRef, useState, useEffect } from "react";
import {
  ClockIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
  UsersIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import type { DoctorAvailabilityDTO } from "../../../../types/doctorPortal.types";
import { SkeletonBlock } from "../shared/DoctorPortalAtoms";
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  ORDERED_DAYS,
  formatTime,
} from "./availabilityConstants";

// ── Slot actions menu ──────────────────────────────────────────────────────
interface SlotActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const SlotActionsMenu = ({ onEdit, onDelete }: SlotActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Slot actions"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
      >
        <DotsThreeVerticalIcon size={16} weight="bold" />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <PencilSimpleIcon size={14} />
            Edit slot
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <TrashIcon size={14} />
            Delete slot
          </button>
        </div>
      )}
    </div>
  );
};

// ── Individual slot card ───────────────────────────────────────────────────
interface SlotCardProps {
  slot: DoctorAvailabilityDTO;
  onEdit: (slot: DoctorAvailabilityDTO) => void;
  onDelete: (slot: DoctorAvailabilityDTO) => void;
}

const SlotCard = ({ slot, onEdit, onDelete }: SlotCardProps) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-white hover:shadow-sm">
    <div className="flex min-w-0 items-center gap-3">
      {/* Time range */}
      <div className="flex items-center gap-1.5 text-slate-700">
        <ClockIcon size={14} className="flex-shrink-0 text-slate-400" />
        <span className="text-sm font-semibold tabular-nums">
          {formatTime(slot.startTime)}
        </span>
        <span className="text-slate-400">–</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatTime(slot.endTime)}
        </span>
      </div>

      {/* Divider */}
      <span className="text-slate-300">·</span>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-slate-500">
        <UsersIcon size={13} className="flex-shrink-0" />
        <span className="text-xs font-medium">{slot.maxAppointments} patients</span>
      </div>
    </div>

    <div className="flex flex-shrink-0 items-center gap-2">
      {!slot.isAvailable && (
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
          Paused
        </span>
      )}
      <SlotActionsMenu
        onEdit={() => onEdit(slot)}
        onDelete={() => onDelete(slot)}
      />
    </div>
  </div>
);

// ── Day group header ───────────────────────────────────────────────────────
interface DayGroupProps {
  day: (typeof ORDERED_DAYS)[number];
  slots: DoctorAvailabilityDTO[];
  onEdit: (slot: DoctorAvailabilityDTO) => void;
  onDelete: (slot: DoctorAvailabilityDTO) => void;
}

const DayGroup = ({ day, slots, onEdit, onDelete }: DayGroupProps) => (
  <div>
    {/* Day header */}
    <div className="mb-2.5 flex items-center gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
        {DAY_SHORT_LABELS[day]}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{DAY_LABELS[day]}</p>
        <p className="text-xs text-slate-400">
          {slots.length} {slots.length === 1 ? "slot" : "slots"} ·{" "}
          {slots.reduce((s, sl) => s + sl.maxAppointments, 0)} patients max
        </p>
      </div>
    </div>

    {/* Slot cards */}
    <div className="ml-11 space-y-2">
      {slots.map((slot) => (
        <SlotCard key={slot.id} slot={slot} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  </div>
);

// ── Empty state ────────────────────────────────────────────────────────────
const EmptyAvailability = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-14 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
      <CalendarBlankIcon size={28} weight="duotone" className="text-blue-500" />
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-800">No availability configured</p>
    <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
      Add your first weekly slot above. Patients will be able to book appointments within these windows.
    </p>
  </div>
);

// ── Loading skeleton ───────────────────────────────────────────────────────
const AvailabilitySkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i}>
        <div className="mb-2.5 flex items-center gap-3">
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-20 rounded" />
            <SkeletonBlock className="h-3 w-32 rounded" />
          </div>
        </div>
        <div className="ml-11 space-y-2">
          <SkeletonBlock className="h-12 rounded-xl" />
          {i === 1 && <SkeletonBlock className="h-12 rounded-xl" />}
        </div>
      </div>
    ))}
  </div>
);

// ── Main list component ────────────────────────────────────────────────────
interface AvailabilitySlotListProps {
  slots: DoctorAvailabilityDTO[] | undefined;
  isLoading: boolean;
  onEdit: (slot: DoctorAvailabilityDTO) => void;
  onDelete: (slot: DoctorAvailabilityDTO) => void;
}

const AvailabilitySlotList = ({
  slots,
  isLoading,
  onEdit,
  onDelete,
}: AvailabilitySlotListProps) => {
  if (isLoading) return <AvailabilitySkeleton />;

  if (!slots?.length) return <EmptyAvailability />;

  // Group slots by weekday and preserve the Mon→Sun order.
  const grouped = ORDERED_DAYS.reduce<
    Record<string, DoctorAvailabilityDTO[]>
  >((acc, day) => {
    const daySlots = slots.filter((s) => s.dayOfWeek === day);
    if (daySlots.length > 0) acc[day] = daySlots;
    return acc;
  }, {});

  const configuredDays = ORDERED_DAYS.filter((day) => grouped[day]);

  return (
    <div className="space-y-6">
      {configuredDays.map((day) => (
        <DayGroup
          key={day}
          day={day}
          slots={grouped[day]!}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default AvailabilitySlotList;
