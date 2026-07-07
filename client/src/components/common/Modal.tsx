import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface ModalContextValue {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const useModalContext = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("Modal.Header/.Body/.Footer must be used inside <Modal>");
  }
  return ctx;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const Modal = ({ isOpen, onClose, children, className = "" }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <ModalContext.Provider value={{ onClose }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl bg-white shadow-xl ${className}`}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
};

interface ModalHeaderProps {
  children: ReactNode;
  showCloseButton?: boolean;
}

const ModalHeader = ({ children, showCloseButton = true }: ModalHeaderProps) => {
  const { onClose } = useModalContext();

  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
      <h2 className="text-base font-semibold text-slate-950">{children}</h2>
      {showCloseButton && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-slate-400 hover:text-slate-900 cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
};

const ModalBody = ({ children }: { children: ReactNode }) => (
  <div className="px-6 py-5">{children}</div>
);

const ModalFooter = ({ children }: { children: ReactNode }) => (
  <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
    {children}
  </div>
);

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;