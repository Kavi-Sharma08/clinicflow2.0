import ChangePasswordForm from "../../common/ChangePasswordForm";

export default function AdminChangePassword() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
      <ChangePasswordForm
        title="Admin Change Password"
        description="Update your administrator credentials securely."
      />
    </div>
  );
}
