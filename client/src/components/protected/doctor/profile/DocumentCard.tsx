import { useState, type ChangeEvent } from "react";
import {
  FileTextIcon,
  EyeIcon,
  TrashIcon,
  UploadSimpleIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  SpinnerGapIcon,
  CloudArrowUpIcon,
} from "@phosphor-icons/react";
import type { DoctorDocumentType } from "../../../../types/doctorPortal.types";
import { isImageUrl } from "./DocumentPreviewModal";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

const DOCUMENT_TYPES: DoctorDocumentType[] = [
  "MEDICAL_LICENSE",
  "GOVERNMENT_ID",
  "DEGREE_CERTIFICATE",
  "CERTIFICATION",
  "OTHER",
];

export const DOCUMENT_TYPE_LABELS: Record<DoctorDocumentType, string> = {
  MEDICAL_LICENSE: "Medical License",
  GOVERNMENT_ID: "Government ID",
  DEGREE_CERTIFICATE: "Degree Certificate",
  CERTIFICATION: "Certification",
  OTHER: "Other Document",
};

export interface DocumentCardItem {
  id?: string;
  documentType: DoctorDocumentType;
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  remarks?: string | null;
  isExisting?: boolean;
}

interface DocumentCardProps {
  document: DocumentCardItem;
  onChangeDocumentType: (type: DoctorDocumentType) => void;
  onChangeFileUrl: (url: string, fileName?: string) => void;
  onChangeRemarks: (remarks: string) => void;
  onRemove: () => void;
  onPreview: (title: string, url: string) => void;
}

export default function DocumentCard({
  document,
  onChangeDocumentType,
  onChangeFileUrl,
  onChangeRemarks,
  onRemove,
  onPreview,
}: DocumentCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const hasFile = Boolean(document.fileUrl && document.fileUrl.trim());
  const isImg = hasFile && isImageUrl(document.fileUrl);
  const titleLabel = DOCUMENT_TYPE_LABELS[document.documentType] || "Document";

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImgError(false);
    setImgLoading(true);

    try {
      const { data } = await api.get("/doctor/verification/upload-signature", {
        params: { subfolder: "verification-docs" },
      });
      const { signature, timestamp, cloudName, apiKey, folder } = data.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp);
      formData.append("api_key", apiKey);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadData = await uploadRes.json();
      onChangeFileUrl(uploadData.secure_url, file.name);
      toast.success(`${titleLabel} uploaded successfully.`);
    } catch (err) {
      console.error("Document upload error:", err);
      toast.error(`Failed to upload ${titleLabel}. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <article className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      {/* Top Bar: Type selector & Remove Trash Icon */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileTextIcon size={18} weight="bold" />
          </span>
          <select
            value={document.documentType}
            onChange={(e) => onChangeDocumentType(e.target.value as DoctorDocumentType)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {hasFile ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircleIcon size={13} weight="fill" /> Uploaded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <WarningCircleIcon size={13} weight="fill" /> Needs file
            </span>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${titleLabel}`}
            title={`Remove ${titleLabel}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
          >
            <TrashIcon size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Main Body: Thumbnail / Upload Area + Remarks */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
        {/* Left Side: Thumbnail Preview / Upload Box */}
        <div className="relative flex flex-col items-center justify-center">
          {hasFile ? (
            <div
              onClick={() => onPreview(titleLabel, document.fileUrl)}
              className="group/thumb relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1 transition hover:border-blue-400 hover:shadow-sm"
              title="Click to expand preview"
            >
              {isImg ? (
                <>
                  {imgLoading && !imgError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400">
                      <SpinnerGapIcon size={20} className="animate-spin text-blue-500" />
                    </div>
                  )}
                  {imgError ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <FileTextIcon size={28} />
                      <span className="mt-1 text-[10px] text-slate-500">Preview error</span>
                    </div>
                  ) : (
                    <img
                      src={document.fileUrl}
                      alt={titleLabel}
                      onLoad={() => setImgLoading(false)}
                      onError={() => {
                        setImgLoading(false);
                        setImgError(true);
                      }}
                      className={`h-full w-full object-contain rounded-xl transition ${
                        imgLoading ? "opacity-0" : "opacity-100"
                      }`}
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-blue-600">
                  <FileTextIcon size={32} weight="bold" />
                  <span className="mt-1 text-[10px] font-semibold text-slate-600">
                    PDF / Document
                  </span>
                </div>
              )}

              {/* Hover overlay with eye icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover/thumb:opacity-100 rounded-xl">
                <span className="flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">
                  <EyeIcon size={14} weight="bold" /> Preview
                </span>
              </div>
            </div>
          ) : (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-3 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <SpinnerGapIcon size={24} className="animate-spin text-blue-600" />
                  <span className="text-[11px] font-medium text-slate-500">Uploading...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon size={28} className="text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600">Upload file</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, PDF</span>
                </>
              )}
            </label>
          )}

          {/* Re-upload button if file exists */}
          {hasFile && (
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <span className="text-slate-400">Replacing...</span>
              ) : (
                <>
                  <UploadSimpleIcon size={13} weight="bold" /> Replace file
                </>
              )}
            </label>
          )}
        </div>

        {/* Right Side: Document Details & Remarks */}
        <div className="flex flex-col justify-between gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Remarks / Notes <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={document.remarks ?? ""}
              onChange={(e) => onChangeRemarks(e.target.value)}
              placeholder="e.g. Verified registration certificate, valid until 2030"
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Actions: View & Remove */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {hasFile && (
              <button
                type="button"
                onClick={() => onPreview(titleLabel, document.fileUrl)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
              >
                <EyeIcon size={15} weight="bold" /> View document
              </button>
            )}

            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
            >
              <TrashIcon size={15} weight="bold" /> Delete document
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
