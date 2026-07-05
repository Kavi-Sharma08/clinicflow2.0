import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import CustomButton from "../../custom-fields/CustomButton";
import type { DoctorVerificationStatus } from "../../../types/role.types";
import { useUser } from "../../../context/UserContext";

interface StatusResponse {
  verificationStatus: DoctorVerificationStatus;
  submittedAt?: string;
}

const VerificationStatus = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get("/doctor/verification/status");
        setStatus(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-[#6b7b94]">Loading...</p>
      </div>
    );
  }

  const verificationStatus = status?.verificationStatus ?? "NOT_SUBMITTED";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d9e6f7] bg-white p-6 sm:p-8 shadow-sm text-center">
        {verificationStatus === "PENDING" && (
          <>
            <h1 className="text-base sm:text-lg font-semibold text-[#0A1628]">Your application is under review</h1>
            <p className="mt-2 text-sm text-[#6b7b94]">
              We're verifying your credentials. This usually takes a day or two.
              We'll email you as soon as a decision is made.
            </p>
          </>
        )}

        {verificationStatus === "REJECTED" && (
          <>
            <h1 className="text-base sm:text-lg font-semibold text-[#0A1628]">We need a bit more from you</h1>
            <p className="mt-2 text-sm text-[#6b7b94]">
              Your application could not be verified. Please review your documents and submit the updated profile again.
            </p>
            <CustomButton
              className="mt-5 w-full sm:w-auto"
              onClick={() => navigate("/onboarding/verification")}
            >
              Resubmit your details
            </CustomButton>
          </>
        )}

        {verificationStatus === "VERIFIED" && (
          <>
            <h1 className="text-base sm:text-lg font-semibold text-[#0A1628]">Your profile is verified</h1>
            <p className="mt-2 text-sm text-[#6b7b94]">
              You can now access your doctor dashboard and manage availability.
            </p>
            <CustomButton
              className="mt-5 w-full sm:w-auto"
              onClick={() => navigate(`/doctor/dashboard/${user?.id ?? ""}`)}
            >
              Go to dashboard
            </CustomButton>
          </>
        )}

        {verificationStatus === "NOT_SUBMITTED" && (
          <>
            <h1 className="text-base sm:text-lg font-semibold text-[#0A1628]">You haven't submitted your details yet</h1>
            <p className="mt-2 text-sm text-[#6b7b94]">
              We need to verify your medical credentials before you can access your dashboard.
            </p>
            <CustomButton
              className="mt-5 w-full sm:w-auto"
              onClick={() => navigate("/onboarding/verification")}
            >
              Start verification
            </CustomButton>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus;