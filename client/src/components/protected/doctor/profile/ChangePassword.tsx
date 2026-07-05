import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { KeyIcon } from "@phosphor-icons/react";
import api from "../../../../lib/axios";
import CustomButton from "../../../custom-fields/CustomButton";
import CustomInputField from "../../../custom-fields/CustomInputField";
import { handleFormError } from "../../../../utils/handleFormError";

interface ChangePasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordForm() {
  const { control, handleSubmit, setError, reset, watch } = useForm<ChangePasswordValues>({
    defaultValues: { 
      oldPassword: "", 
      newPassword: "", 
      confirmPassword: "" 
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) => api.post("/auth/change-password", values),
    onSuccess: () => {
      toast.success("Password updated successfully.");
      reset();
    },
    onError: (err) => handleFormError(err, setError),
  });

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-[#0A1628] flex items-center gap-2">
          <KeyIcon size={24} className="text-[#0057A8]" weight="bold" />
          Security Credentials
        </h2>
        <p className="text-sm text-[#6b7b94] mt-1">
          Update your secure access configurations below.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit((data) => mutation.mutate(data))} 
        className="space-y-5 max-w-md"
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
            minLength: { value: 6, message: "Minimum 6 characters required" } 
          }}
        />

        <CustomInputField
          name="confirmPassword"
          type="password"
          control={control}
          label="Confirm New Password"
          rules={{ 
            required: "Please confirm your new password",
            validate: (val: string) => val === watch("newPassword") || "Passwords do not match" 
          }}
        />

        <div className="pt-4 flex justify-start">
          <CustomButton 
            type="submit" 
            variant="primary" 
            fullWidth={false} 
            loading={mutation.isPending} 
            loadingText="Updating security..." 
            className="px-8 py-2.5 rounded-full"
          >
            Change Password
          </CustomButton>
        </div>
      </form>
    </div>
  );
}