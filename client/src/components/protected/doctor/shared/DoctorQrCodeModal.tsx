import { useEffect, useRef, useState } from "react";
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
} from "@phosphor-icons/react";
import type { DoctorQrCodeDTO } from "../../../../types/doctorPortal.types";

interface DoctorQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData?: DoctorQrCodeDTO;
  isLoading?: boolean;
}

const DoctorQrCodeModal = ({ isOpen, onClose, qrData, isLoading }: DoctorQrCodeModalProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrData?.bookingUrl) {
      QRCode.toDataURL(qrData.bookingUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [qrData?.bookingUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!qrData?.bookingUrl) return;
    try {
      await navigator.clipboard.writeText(qrData.bookingUrl);
      toast.success("Public booking link copied to clipboard!");
    } catch {
      toast.error("Unable to copy to clipboard.");
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `clinicflow-${qrData?.slug || "doctor"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR code downloaded.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 print:border-none print:shadow-none print:max-w-none">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <QrCodeIcon size={20} weight="bold" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Clinic Reception QR Code</h3>
              <p className="text-[11px] text-slate-500">Permanent booking & walk-in QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 print:p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
              <p className="text-xs text-slate-500">Generating clinic QR code...</p>
            </div>
          ) : !qrData ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">Failed to load QR code details.</p>
            </div>
          ) : (
            <>
              {/* Guidance / Status Banners */}
              {!qrData.isVerified && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3 print:hidden">
                  <WarningCircleIcon size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div className="text-xs text-amber-900">
                    <p className="font-semibold">Profile Pending Verification</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">{qrData.instructions}</p>
                  </div>
                </div>
              )}

              {qrData.isVerified && !qrData.hasAvailability && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3 print:hidden">
                  <WarningCircleIcon size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div className="text-xs text-amber-900">
                    <p className="font-semibold">No Active Availability Configured</p>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">{qrData.instructions}</p>
                  </div>
                </div>
              )}

              {qrData.isVerified && qrData.hasAvailability && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2.5 print:hidden">
                  <CheckCircleIcon size={18} className="text-emerald-600 shrink-0" weight="fill" />
                  <p className="text-xs text-emerald-800 font-medium">
                    QR Code is active and accepting bookings ({qrData.activeSlotsCount} configured schedule slot{qrData.activeSlotsCount === 1 ? "" : "s"}).
                  </p>
                </div>
              )}

              {/* Printable Reception Sign Container */}
              <div
                ref={printRef}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center print:border-none print:bg-white print:p-8"
              >
                <div className="text-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 bg-sky-100/70 px-2.5 py-1 rounded-full">
                    ClinicFlow
                  </span>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                    {qrData.doctorName}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    {qrData.department}
                  </p>
                  {qrData.clinicAddress && (
                    <p className="mt-0.5 text-[11px] text-slate-500 max-w-xs mx-auto">
                      {qrData.clinicAddress}
                    </p>
                  )}
                </div>

                {/* QR Code Container */}
                <div className="rounded-2xl bg-white p-3.5 shadow-md border border-slate-200/80 print:shadow-none print:border-2 print:border-slate-800">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Booking QR Code for ${qrData.doctorName}`}
                      className="h-56 w-56 object-contain"
                    />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center bg-slate-100 text-xs text-slate-400">
                      Generating...
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-slate-900">
                    Scan with Phone Camera to Book
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    View schedule, reserve an appointment slot, or join today's walk-in queue. No login required.
                  </p>
                </div>
              </div>

              {/* Public URL Box - Hidden in Print */}
              <div className="space-y-1.5 print:hidden">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Public Booking URL
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <span className="truncate text-xs font-mono text-slate-700 select-all flex-1 px-1">
                    {qrData.bookingUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <CopyIcon size={14} /> Copy
                  </button>
                  <a
                    href={qrData.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
                    title="Open public booking page"
                  >
                    <ArrowSquareOutIcon size={14} />
                  </a>
                </div>
              </div>

              {/* Action Buttons - Hidden in Print */}
              <div className="grid grid-cols-2 gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition disabled:opacity-50"
                >
                  <DownloadSimpleIcon size={16} />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!qrDataUrl}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 shadow-sm transition disabled:opacity-50"
                >
                  <PrinterIcon size={16} />
                  Print Reception Sign
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQrCodeModal;
