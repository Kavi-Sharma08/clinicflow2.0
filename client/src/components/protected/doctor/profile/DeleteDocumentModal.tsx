import Modal from "../../../common/Modal";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentTitle?: string;
}

export default function DeleteDocumentModal({
  isOpen,
  onClose,
  onConfirm,
  documentTitle = "this document",
}: DeleteDocumentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <Modal.Header showCloseButton={true}>Remove Document</Modal.Header>
      <Modal.Body>
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <WarningCircleIcon size={22} weight="bold" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Remove document?</h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-700">{documentTitle}</span>? It will be removed when you save your profile.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer"
        >
          <TrashIcon size={16} weight="bold" /> Remove
        </button>
      </Modal.Footer>
    </Modal>
  );
}
