import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import {
  CopyIcon,
  DownloadSimpleIcon,
  PrinterIcon,
  XIcon,
  QrCodeIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  ArrowSquareOutIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react";
import type { DoctorQrCodeDTO } from "../../../../types/doctorPortal.types";

interface DoctorQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData?: DoctorQrCodeDTO;
  isLoading?: boolean;
  onRetry?: () => void;
}

const DoctorQrCodeModal = ({
  isOpen,
  onClose,
  qrData,
  isLoading,
  onRetry,
}: DoctorQrCodeModalProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  // Compute the reliable public booking URL
  // If backend returned a localhost URL but browser is on a deployed domain (or vice versa),
  // dynamically align with the active browser origin so the link and QR always function.
  const effectiveBookingUrl = useMemo(() => {
    if (!qrData?.bookingUrl) return "";
    if (typeof window === "undefined" || !window.location?.origin) {
      return qrData.bookingUrl;
    }

    try {
      const url = new URL(qrData.bookingUrl);
      const isUrlLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      const isCurrentLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isUrlLocal !== isCurrentLocal) {
        const identifier = qrData.slug || qrData.doctorId;
        return `${window.location.origin}/book/${identifier}`;
      }
      return qrData.bookingUrl;
    } catch {
      return qrData.bookingUrl;
    }
  }, [qrData?.bookingUrl, qrData?.slug, qrData?.doctorId]);

  // Generate crisp QR code data URL whenever effective booking URL changes
  useEffect(() => {
    if (effectiveBookingUrl) {
      QRCode.toDataURL(effectiveBookingUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    } else {
      setQrDataUrl("");
    }
  }, [effectiveBookingUrl]);

  // Handle Escape key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!effectiveBookingUrl) return;
    try {
      await navigator.clipboard.writeText(effectiveBookingUrl);
      toast.success("Public booking link copied to clipboard!");
    } catch {
      toast.error("Unable to copy to clipboard.");
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `clinicflow-${qrData?.slug || qrData?.doctorId || "doctor"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR code downloaded.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 print:border-none print:shadow-none print:max-w-none max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* ── Fixed Header (Never scrolls off-screen) ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-3.5 sm:py-4 bg-white z-10 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <QrCodeIcon size={20} weight="bold" />
            </div>
            <div className="min-w-0">
              <h3 id="qr-modal-title" className="font-bold text-slate-900 text-sm truncate">
                Clinic Reception QR Code
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Permanent booking & walk-in QR code
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ml-2"
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* ── Scrollable Body Area ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 print:p-0 print:overflow-visible overscroll-contain">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
              <p className="text-xs text-slate-500">Generating clinic QR code...</p>
            </div>
          ) : !qrData ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <WarningCircleIcon size={24} weight="bold" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Failed to load QR code details
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Unable to retrieve clinic QR code details from the server. Please check your connection and try again.
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <ArrowClockwiseIcon size={14} />
                  Retry
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Guidance / Status Banners */}
              {!qrData.isVerified && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-3.5 flex items-start gap-2.5 print:hidden">
                  <WarningCircleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div className="text-xs text-amber-900 min-w-0">
                    <p className="font-semibold">Profile Pending Verification</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed text-[11px] sm:text-xs">
                      {qrData.instructions}
                    </p>
                  </div>
                </div>
              )}

              {qrData.isVerified && !qrData.hasAvailability && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-3.5 flex items-start gap-2.5 print:hidden">
                  <WarningCircleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div className="text-xs text-amber-900 min-w-0">
                    <p className="font-semibold">No Active Availability Configured</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed text-[11px] sm:text-xs">
                      {qrData.instructions}
                    </p>
                  </div>
                </div>
              )}

              {qrData.isVerified && qrData.hasAvailability && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 sm:p-3 flex items-center gap-2.5 print:hidden">
                  <CheckCircleIcon size={18} className="text-emerald-600 shrink-0" weight="fill" />
                  <p className="text-xs text-emerald-800 font-medium">
                    QR Code is active and accepting bookings ({qrData.activeSlotsCount} configured schedule slot
                    {qrData.activeSlotsCount === 1 ? "" : "s"}).
                  </p>
                </div>
              )}

              {/* Printable Reception Sign Container */}
              <div
                ref={printRef}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 sm:p-6 text-center print:border-none print:bg-white print:p-8"
              >
                <div className="text-center mb-3 sm:mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 bg-sky-100/70 px-2.5 py-1 rounded-full">
                    ClinicFlow
                  </span>
                  <h2 className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                    {qrData.doctorName}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    {qrData.department}
                  </p>
                  {qrData.clinicAddress && (
                    <p className="mt-0.5 text-[11px] text-slate-500 max-w-xs mx-auto line-clamp-2">
                      {qrData.clinicAddress}
                    </p>
                  )}
                </div>

                {/* QR Code Graphic Container */}
                <div className="rounded-2xl bg-white p-3 sm:p-3.5 shadow-md border border-slate-200/80 print:shadow-none print:border-2 print:border-slate-800">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Booking QR Code for ${qrData.doctorName}`}
                      className="h-44 w-44 sm:h-52 sm:w-52 object-contain"
                    />
                  ) : (
                    <div className="flex h-44 w-44 sm:h-52 sm:w-52 items-center justify-center bg-slate-100 text-xs text-slate-400">
                      Generating...
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 text-center">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Scan with Phone Camera to Book
                  </p>
                  <p className="mt-1 text-[11px] sm:text-xs text-slate-500 max-w-xs leading-relaxed">
                    View schedule, reserve an appointment slot, or join today's walk-in queue. No login required.
                  </p>
                </div>
              </div>

              {/* Public URL Box - Hidden in Print */}
              <div className="space-y-1.5 print:hidden">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Public Booking URL
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:p-2 min-w-0">
                  <span className="truncate text-[11px] sm:text-xs font-mono text-slate-700 select-all flex-1 px-1 min-w-0">
                    {effectiveBookingUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-lg bg-white px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition"
                    title="Copy public booking link"
                  >
                    <CopyIcon size={14} />
                    <span className="hidden xs:inline">Copy</span>
                  </button>
                  <a
                    href={effectiveBookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-sky-50 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
                    title="Open public booking page in new tab"
                  >
                    <ArrowSquareOutIcon size={14} />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Fixed Footer Action Buttons (Always visible and accessible) ── */}
        {qrData && !isLoading && (
          <div className="shrink-0 border-t border-slate-100 px-5 sm:px-6 py-3 sm:py-3.5 bg-slate-50/80 backdrop-blur-xs print:hidden z-10">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-sm transition disabled:opacity-50"
              >
                <DownloadSimpleIcon size={16} />
                <span className="truncate">Download PNG</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!qrDataUrl}
                className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-600 px-3 sm:px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 shadow-sm transition disabled:opacity-50"
              >
                <PrinterIcon size={16} />
                <span className="truncate">Print Reception Sign</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorQrCodeModal;
