import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { AdminDoctorProfileDTO } from "../../../../types/doctor.types";
import CustomButton from "../../../custom-fields/CustomButton";

interface DoctorVerificationActionsProps {
  doctorProfile: AdminDoctorProfileDTO;
  isVerifying: boolean;
  onVerify: () => void;
  onReject: () => void;
}

export function DoctorVerificationActions({ doctorProfile, isVerifying, onVerify, onReject }: DoctorVerificationActionsProps) {
  const isPending = doctorProfile.verificationStatus === "PENDING";

  return (
    <section className="cf-card p-5">
      <h2 className="text-base font-bold text-slate-950">Admin Actions</h2>
      <p className="mt-1 text-sm text-slate-500">
        Verification actions are enabled only while the doctor profile is pending review.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <CustomButton
          variant="primary"
          fullWidth
          disabled={!isPending}
          loading={isVerifying}
          loadingText="Verifying..."
          onClick={onVerify}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircleIcon size={18} weight="bold" /> Verify Doctor
        </CustomButton>
        <CustomButton
          variant="danger"
          fullWidth
          disabled={!isPending || isVerifying}
          onClick={onReject}
          className="rounded-xl"
        >
          <XCircleIcon size={18} weight="bold" /> Reject Doctor
        </CustomButton>
      </div>
    </section>
  );
}
