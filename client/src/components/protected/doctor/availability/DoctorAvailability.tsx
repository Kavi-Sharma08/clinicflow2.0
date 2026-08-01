import { useState } from "react";
import { CalendarDotsIcon, InfoIcon } from "@phosphor-icons/react";
import { useDoctorAvailability } from "../../../../hooks/useDoctorPortal";
import type { DoctorAvailabilityDTO } from "../../../../types/doctorPortal.types";
import { SectionCard } from "../shared/DoctorPortalAtoms";
import AvailabilityCreateForm from "./AvailabilityCreateForm";
import AvailabilitySlotList from "./AvailabilitySlotList";
import AvailabilityEditModal from "./AvailabilityEditModal";
import AvailabilityDeleteModal from "./AvailabilityDeleteModal";

const DoctorAvailability = () => {
  const { data: slots, isLoading } = useDoctorAvailability();

  const [editingSlot, setEditingSlot] = useState<DoctorAvailabilityDTO | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<DoctorAvailabilityDTO | null>(null);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="hidden flex-shrink-0 sm:flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
          <CalendarDotsIcon size={22} weight="duotone" className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Availability Management
          </h1>
        </div>
      </div>

      {/* Create form */}
      <SectionCard
        title="Add availability slot"
        description="Select a weekday, consultation window, and maximum patient capacity."
      >
        <AvailabilityCreateForm />
      </SectionCard>

      {/* Slot list */}
      <SectionCard
        title="Weekly schedule"
        description="Configured slots grouped by weekday."
      >
        <AvailabilitySlotList
          slots={slots}
          isLoading={isLoading}
          onEdit={setEditingSlot}
          onDelete={setDeletingSlot}
        />
      </SectionCard>

      {/* Modals */}
      <AvailabilityEditModal
        slot={editingSlot}
        onClose={() => setEditingSlot(null)}
      />
      <AvailabilityDeleteModal
        slot={deletingSlot}
        onClose={() => setDeletingSlot(null)}
      />
    </div>
  );
};

export default DoctorAvailability;