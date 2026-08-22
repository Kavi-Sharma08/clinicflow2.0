import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon, FileTextIcon, ArrowSquareOutIcon, WarningCircleIcon, SpinnerGapIcon } from "@phosphor-icons/react";

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
}

export function isImageUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split("?")[0];
  if (cleanUrl.match(/\.(jpeg|jpg|png|webp|gif|svg)$/)) return true;
  if (cleanUrl.includes("res.cloudinary.com") && (cleanUrl.includes("/image/upload/") || cleanUrl.includes(".jpg") || cleanUrl.includes(".png") || cleanUrl.includes(".jpeg") || cleanUrl.includes(".webp"))) {
    return true;
  }
  if (cleanUrl.startsWith("data:image/")) return true;
  // Cloudinary URLs without explicit extension are often images if subfolder is image upload
  if (cleanUrl.includes("cloudinary.com") && !cleanUrl.endsWith(".pdf") && !cleanUrl.endsWith(".doc") && !cleanUrl.endsWith(".docx")) {
    return true;
  }
  return false;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  fileUrl,
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, fileUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isImg = isImageUrl(fileUrl);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-4xl flex-col max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileTextIcon size={20} weight="bold" />
            </span>
            <div>
              <h2 id="document-preview-modal-title" className="text-base font-bold text-slate-950 truncate max-w-xs sm:max-w-md">
                {title || "Document Preview"}
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {isImg ? "Image Document Preview" : "Document File Preview"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <XIcon size={20} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-950/5 p-6 min-h-[300px]">
          {isImg ? (
            <>
              {isLoading && !hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
                  <SpinnerGapIcon size={32} className="animate-spin text-blue-600" />
                  <span className="text-xs font-medium text-slate-500">Loading document image...</span>
                </div>
              )}
              {hasError ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <WarningCircleIcon size={28} weight="bold" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Unable to preview document</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm">
                      The document format cannot be rendered in image preview or failed to load.
                    </p>
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <ArrowSquareOutIcon size={16} weight="bold" /> Open in new tab
                    </a>
                  )}
                </div>
              ) : (
                <img
                  src={fileUrl}
                  alt={title}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                  className={`max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-md transition-opacity duration-200 ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FileTextIcon size={36} weight="bold" />
              </span>
              <div>
                <p className="text-base font-bold text-slate-900">{title || "Document File"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  This file type cannot be previewed inline as an image.
                </p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <ArrowSquareOutIcon size={18} weight="bold" /> Open document in browser
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-white">
          <span className="text-xs text-slate-400 truncate max-w-md">
            Aspect ratio preserved
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
