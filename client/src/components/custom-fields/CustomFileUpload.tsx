import { useState, useRef, type InputHTMLAttributes, type ChangeEvent } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { UploadSimpleIcon, CheckCircleIcon, FileTextIcon, TrashIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import api from "../../lib/axios";
import toast from "react-hot-toast";

type UploadFolder = "license" | "govt-id";

const CLOUDINARY_UPLOAD_URL = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type CustomFileUploadFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label: string;
  accept?: string;
  uploadFolder: UploadFolder;
  helperText?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "onChange" | "disabled" | "type" | "accept"
>;

const CustomFileUploadField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules = {},
  label,
  accept = "application/pdf,image/jpeg,image/png,image/jpg",
  uploadFolder,
  helperText = "PDF, JPG, or PNG · Max 5MB",
  onChange,
  disabled = false,
  ...rest
}: CustomFileUploadFieldProps<TFieldValues>) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (file.size > MAX_FILE_SIZE) {
            toast.error("File size exceeds 5MB limit. Please choose a smaller file.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          setFileName(file.name);
          if (file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file));
          } else {
            setPreviewUrl(null);
          }

          setIsUploading(true);

          try {
            const { data } = await api.get("/doctor/verification/upload-signature", {
              params: { subfolder: uploadFolder },
            });
            const { signature, timestamp, cloudName, apiKey, folder } = data.data;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("signature", signature);
            formData.append("timestamp", timestamp);
            formData.append("api_key", apiKey);
            formData.append("folder", folder);

            const uploadRes = await fetch(CLOUDINARY_UPLOAD_URL(cloudName), {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const uploadData = await uploadRes.json();

            field.onChange(uploadData.secure_url);
            typeof onChange === "function" && onChange(uploadData.secure_url);
            toast.success(`${label} uploaded successfully`);
          } catch (err) {
            console.error(err);
            toast.error(`Failed to upload ${label}. Please try again.`);
            setFileName(null);
            setPreviewUrl(null);
            field.onChange("");
            typeof onChange === "function" && onChange("");
            if (fileInputRef.current) fileInputRef.current.value = "";
          } finally {
            setIsUploading(false);
          }
        };

        const handleRemove = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setFileName(null);
          setPreviewUrl(null);
          field.onChange("");
          typeof onChange === "function" && onChange("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        };

        const hasUploaded = Boolean(field.value);
        const isImage = previewUrl || (typeof field.value === "string" && /\.(jpg|jpeg|png|webp)($|\?)/i.test(field.value));

        return (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                {label}
                {rules?.required && <span className="ml-0.5 text-rose-500">*</span>}
              </label>
              {hasUploaded && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircleIcon size={12} weight="bold" />
                  Uploaded
                </span>
              )}
            </div>

            <div
              onClick={() => {
                if (!isUploading && !disabled) {
                  fileInputRef.current?.click();
                }
              }}
              className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition
                ${
                  error
                    ? "border-red-600 bg-red-50/50"
                    : hasUploaded
                    ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                    : "border-slate-200 bg-white hover:border-[var(--color-primary-600)] hover:bg-slate-50/50"
                }
                ${isUploading ? "opacity-75 pointer-events-none" : ""}
                ${disabled ? "cursor-not-allowed bg-slate-50 opacity-60" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                onBlur={field.onBlur}
                className="hidden"
                disabled={isUploading || disabled}
                {...rest}
              />

              {isUploading ? (
                <div className="flex items-center gap-3 py-1">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Uploading document...</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{fileName}</p>
                  </div>
                </div>
              ) : hasUploaded ? (
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {isImage ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <img
                          src={previewUrl || field.value}
                          alt="Document Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border border-[var(--color-primary-200)]">
                        <FileTextIcon size={20} weight="duotone" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                        {fileName || (typeof field.value === "string" ? field.value.split("/").pop()?.slice(0, 24) : "Document attached")}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">Ready for review</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label="Replace document"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <ArrowClockwiseIcon size={12} weight="bold" />
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Remove document"
                      onClick={handleRemove}
                      className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100 transition shadow-2xs"
                    >
                      <TrashIcon size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-[var(--color-primary-50)] group-hover:text-[var(--color-primary-600)] transition">
                    <UploadSimpleIcon size={18} weight="bold" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Click to upload document
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Select a file from your computer
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Helper guidance text */}
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-slate-500">{helperText}</span>
              {error && (
                <span className="text-xs text-red-600 font-medium">{error.message}</span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default CustomFileUploadField;