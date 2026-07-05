export type DoctorProfileTab = "overview" | "education" | "documents" | "availability" | "activity";

const TABS: Array<{ id: DoctorProfileTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "education", label: "Education & Experience" },
  { id: "documents", label: "Documents" },
  { id: "availability", label: "Availability" },
  { id: "activity", label: "Activity" },
];

export function DoctorProfileTabs({ activeTab, onChange }: { activeTab: DoctorProfileTab; onChange: (tab: DoctorProfileTab) => void }) {
  return (
    <div className="rounded-[14px] border border-gray-100 bg-white px-3 shadow-sm">
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
