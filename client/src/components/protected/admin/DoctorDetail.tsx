import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, WarningCircleIcon } from "@phosphor-icons/react";
import RejectDoctorModal from "./RejectDoctorModal";
import { useAdminDoctorDetail, useDoctorVerificationActions } from "../../../hooks/useAdminDoctorDetail";
import { DoctorProfileHeader } from "./doctor-profile/DoctorProfileHeader";
import { DoctorProfileSkeleton } from "./doctor-profile/DoctorProfileSkeleton";
import { DoctorProfileTabs, type DoctorProfileTab } from "./doctor-profile/DoctorProfileTabs";
import { DoctorOverviewPanel } from "./doctor-profile/DoctorOverviewPanel";
import { DoctorEducationPanel } from "./doctor-profile/DoctorEducationPanel";
import { DoctorDocumentsPanel } from "./doctor-profile/DoctorDocumentsPanel";
import { DoctorAvailabilityPanel } from "./doctor-profile/DoctorAvailabilityPanel";
import { DoctorActivityPanel } from "./doctor-profile/DoctorActivityPanel";
import { DoctorSidebarPanels } from "./doctor-profile/DoctorSidebarPanels";
import { DoctorVerificationActions } from "./doctor-profile/DoctorVerificationActions";

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DoctorProfileTab>("overview");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const doctorDetailQuery = useAdminDoctorDetail(id);
  const { verifyDoctor, rejectDoctor } = useDoctorVerificationActions(id);

  const detail = doctorDetailQuery.data;
  const doctorProfile = detail?.doctorProfile ?? null;

  const handleVerifyDoctor = () => {
    if (!doctorProfile) return;
    verifyDoctor.mutate(doctorProfile.id);
  };

  const handleRejectDoctor = (reason: string) => {
    if (!doctorProfile) return;
    rejectDoctor.mutate(
      { doctorProfileId: doctorProfile.id, reason },
      {
        onSuccess: () => setIsRejectModalOpen(false),
      }
    );
  };

  if (doctorDetailQuery.isLoading) {
    return <DoctorProfileSkeleton />;
  }

  if (doctorDetailQuery.isError || !detail) {
    return (
      <div className="rounded-[18px] border border-rose-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <WarningCircleIcon size={24} weight="duotone" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-gray-950">Doctor profile could not be loaded</h1>
        <p className="mt-2 text-sm text-gray-500">Please check whether this doctor exists and try again.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/users", { state: { roleFilter: "DOCTOR" } })}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate("/admin/users", { state: { roleFilter: "DOCTOR" } })}
        className="inline-flex items-center gap-2 rounded-lg px-1 text-sm font-semibold text-gray-500 transition hover:text-gray-950"
      >
        <ArrowLeftIcon size={16} /> Back to doctors
      </button>

      <DoctorProfileHeader detail={detail} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <DoctorProfileTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" && <DoctorOverviewPanel detail={detail} />}
          {activeTab === "education" && doctorProfile && <DoctorEducationPanel doctorProfile={doctorProfile} />}
          {activeTab === "documents" && <DoctorDocumentsPanel documents={doctorProfile?.documents ?? []} />}
          {activeTab === "availability" && <DoctorAvailabilityPanel availability={doctorProfile?.availability ?? []} />}
          {activeTab === "activity" && doctorProfile && <DoctorActivityPanel doctorProfile={doctorProfile} />}
        </div>

        <aside className="space-y-5">
          <DoctorSidebarPanels detail={detail} />
          {doctorProfile && (
            <DoctorVerificationActions
              doctorProfile={doctorProfile}
              isVerifying={verifyDoctor.isPending}
              onVerify={handleVerifyDoctor}
              onReject={() => setIsRejectModalOpen(true)}
            />
          )}
        </aside>
      </div>

      {doctorProfile && (
        <RejectDoctorModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onReject={handleRejectDoctor}
          isSubmitting={rejectDoctor.isPending}
        />
      )}
    </div>
  );
};

export default DoctorDetail;
