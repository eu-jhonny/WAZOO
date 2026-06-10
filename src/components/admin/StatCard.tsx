import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, accent = "bg-orange-100 text-orange-600", hint }: StatCardProps) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-400">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-700">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-navy-400">{hint}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
