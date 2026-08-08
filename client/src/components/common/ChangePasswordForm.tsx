import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { KeyIcon } from "@phosphor-icons/react";
import api from "../../lib/axios";
import CustomButton from "../custom-fields/CustomButton";
import CustomInputField from "../custom-fields/CustomInputField";
import { handleFormError } from "../../utils/handleFormError";

interface ChangePasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ChangePasswordForm({
  title = "Security Credentials",
  description = "Update your secure access configurations below.",
  className = "",
}: ChangePasswordFormProps) {
  const { control, handleSubmit, setError, reset, watch } = useForm<ChangePasswordValues>({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) =>
      api.post("/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password updated successfully.");
      reset();
    },
    onError: (err) => handleFormError(err, setError),
  });

  return (
    <div className={className}>
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <KeyIcon size={24} className="text-blue-600" weight="bold" />
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="max-w-md space-y-5"
      >
        <CustomInputField
          name="oldPassword"
          type="password"
          control={control}
          label="Current Password"
          rules={{ required: "Current password is required" }}
        />

        <CustomInputField
          name="newPassword"
          type="password"
          control={control}
          label="New Password"
          rules={{
            required: "New password is required",
            minLength: { value: 6, message: "Minimum 6 characters required" },
          }}
        />

        <CustomInputField
          name="confirmPassword"
          type="password"
          control={control}
          label="Confirm New Password"
          rules={{
            required: "Please confirm your new password",
            validate: (val: string) =>
              val === watch("newPassword") || "Passwords do not match",
          }}
        />

        <div className="flex justify-start pt-2">
          <CustomButton
            type="submit"
            loading={mutation.isPending}
            loadingText="Updating password..."
            className="rounded-full px-8 py-2.5"
          >
            Change Password
          </CustomButton>
        </div>
      </form>
    </div>
  );
}

export default ChangePasswordForm;
