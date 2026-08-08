import ChangePasswordForm from "../../common/ChangePasswordForm";

export default function PatientChangePassword() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
      <ChangePasswordForm
        title="Security & Password"
        description="Update your password to keep your medical account secure."
      />
    </div>
  );
}
