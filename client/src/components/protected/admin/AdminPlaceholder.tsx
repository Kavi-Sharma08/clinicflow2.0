interface AdminPlaceholderProps {
  title: string;
  description: string;
}

const AdminPlaceholder = ({ title, description }: AdminPlaceholderProps) => {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">ClinicFlow Admin</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        This module shell is ready. It will be connected after the matching backend contract is implemented.
      </div>
    </div>
  );
};

export default AdminPlaceholder;
