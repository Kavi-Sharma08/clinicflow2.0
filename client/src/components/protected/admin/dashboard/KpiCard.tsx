import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  sublabel: string;
  icon: Icon;
  accent: "indigo" | "amber" | "emerald" | "violet";
  trend: number[];
}

const accentMap = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", stroke: "#6C63F5" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", stroke: "#F5A623" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", stroke: "#10B981" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", stroke: "#8B5CF6" },
};

export function KpiCard({ label, value, delta, sublabel, icon: IconComp, accent, trend }: KpiCardProps) {
  const colors = accentMap[accent];
  const data = trend.map((v, i) => ({ i, v }));

  return (
    <div className="cf-card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
          <IconComp size={18} weight="bold" />
        </div>
        <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
          <ArrowUpRightIcon size={12} weight="bold" />
          {delta}
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-end justify-between">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <div className="h-8 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="v" stroke={colors.stroke} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}