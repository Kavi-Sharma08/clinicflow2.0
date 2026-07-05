import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface DropdownContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

const useDropdownContext = () => {
  const ctx = useContext(DropdownContext);
  if (!ctx) {
    throw new Error(
      "Dropdown.Trigger/.Menu/.Item must be used inside <Dropdown.Container>"
    );
  }
  return ctx;
};

interface DropdownContainerProps {
  children: ReactNode;
  className?: string;
}

const DropdownContainer = ({ children, className = "" }: DropdownContainerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedContainer = containerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedContainer && !clickedMenu) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close, containerRef, menuRef }}>
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

const DropdownTrigger = ({ children }: { children: ReactNode }) => {
  const { toggle } = useDropdownContext();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className="rounded-md p-1.5 text-[#6b7b94] hover:bg-[#f7faff]"
    >
      {children}
    </button>
  );
};

interface DropdownMenuProps {
  children: ReactNode;
  align?: "left" | "right";
}

const DropdownMenu = ({ children, align = "right" }: DropdownMenuProps) => {
  const { isOpen, containerRef, menuRef } = useDropdownContext();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = containerRef.current;
      const menu = menuRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth || rect.width;

      let left = align === "right" ? rect.right - menuWidth : rect.left;
      const margin = 8;
      left = Math.min(left, window.innerWidth - menuWidth - margin);
      left = Math.max(left, margin);

      setPosition({ top: rect.bottom + 4, left });
    };
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, align, containerRef, menuRef]);

  if (!isOpen || !position) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: position.top, left: position.left }}
      className="z-50 min-w-[160px] rounded-lg border border-[#d9e6f7] bg-white py-1 shadow-lg"
    >
      {children}
    </div>,
    document.body
  );
};

interface DropdownItemProps {
  children: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

const DropdownItem = ({ children, onClick, variant = "default" }: DropdownItemProps) => {
  const { close } = useDropdownContext();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        close();
      }}
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#f7faff] ${
        variant === "danger" ? "text-red-600" : "text-[#0A1628]"
      }`}
    >
      {children}
    </button>
  );
};

const Dropdown = {
  Container: DropdownContainer,
  Trigger: DropdownTrigger,
  Menu: DropdownMenu,
  Item: DropdownItem,
};

export default Dropdown;