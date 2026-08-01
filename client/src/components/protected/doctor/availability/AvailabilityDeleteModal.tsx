import { SpinnerGapIcon, WarningIcon } from "@phosphor-icons/react";
import { useDeleteAvailability } from "../../../../hooks/useDoctorPortal";
import type { DoctorAvailabilityDTO } from "../../../../types/doctorPortal.types";
import Modal from "../../../common/Modal";
import { DAY_LABELS, formatTime } from "./availabilityConstants";

interface AvailabilityDeleteModalProps {
  slot: DoctorAvailabilityDTO | null;
  onClose: () => void;
}

const AvailabilityDeleteModal = ({ slot, onClose }: AvailabilityDeleteModalProps) => {
  const deleteMutation = useDeleteAvailability();

  const handleConfirm = () => {
    if (!slot) return;
    deleteMutation.mutate(slot.id, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={!!slot} onClose={onClose}>
      <Modal.Header>Delete availability slot</Modal.Header>
      <Modal.Body>
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
              <WarningIcon size={20} weight="fill" className="text-rose-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-700">
              You're about to permanently delete the{" "}
              <span className="font-semibold text-slate-950">
                {slot ? DAY_LABELS[slot.dayOfWeek] : ""}
              </span>{" "}
              slot{" "}
              <span className="font-semibold text-slate-950">
                {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : ""}
              </span>
              .
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Patients will no longer be able to book appointments in this window. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Keep slot
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={deleteMutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteMutation.isPending ? (
            <>
              <SpinnerGapIcon size={15} className="animate-spin" />
              Deleting…
            </>
          ) : (
            "Delete slot"
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AvailabilityDeleteModal;
