import { useState, type InputHTMLAttributes, type ChangeEvent } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { UploadSimpleIcon, CheckCircleIcon } from "@phosphor-icons/react";
import api from "../../lib/axios";
import toast from "react-hot-toast";

type UploadFolder = "license" | "govt-id";

const CLOUDINARY_UPLOAD_URL = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

type CustomFileUploadFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: Record<string, any>;
  label: string;
  accept?: string;
  uploadFolder: UploadFolder;
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
  accept = "image/*,application/pdf",
  uploadFolder,
  onChange,
  disabled = false,
  ...rest
}: CustomFileUploadFieldProps<TFieldValues>) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setFileName(file.name);
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
          } catch (err) {
            console.error(err);
            toast.error(`Failed to upload ${label}. Please try again.`);
            setFileName(null);
            field.onChange("");
            typeof onChange === "function" && onChange("");
          } finally {
            setIsUploading(false);
          }
        };

        return (
          <div>
            <label className="block text-sm font-medium text-[#0A1628] mb-2">
              {label}
              {rules?.required && <span className="ml-0.5">*</span>}
            </label>

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition
                ${error ? "border-red-600 bg-red-50" : "border-[#d9e6f7] bg-white hover:border-[#0057A8]"}
              `}
            >
              <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                onBlur={field.onBlur}
                className="hidden"
                disabled={isUploading || disabled}
                {...rest}
              />

              {isUploading ? (
                <span className="text-[#6b7b94]">Uploading...</span>
              ) : field.value ? (
                <>
                  <CheckCircleIcon size={18} weight="bold" className="text-green-600" />
                  <span className="text-[#0A1628] truncate">{fileName ?? "File uploaded"}</span>
                </>
              ) : (
                <>
                  <UploadSimpleIcon size={18} weight="bold" className="text-[#9aafc9]" />
                  <span className="text-[#6b7b94]">Click to upload {label?.toLowerCase()}</span>
                </>
              )}
            </label>

            {error && (
              <span className="mt-1 block text-xs text-red-600">{error.message}</span>
            )}
          </div>
        );
      }}
    />
  );
};

export default CustomFileUploadField;