import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  accent?: 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';
}

const accentMap: Record<NonNullable<MetricCardProps['accent']>, string> = {
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  amber: 'text-[#a0522d] bg-[#FFF9F0] border-[#F2E5D5]',
  sky: 'text-sky-600 bg-sky-50 border-sky-100',
  rose: 'text-[#c2185b] bg-[#FFF0F2] border-[#F7E4E6]',
  slate: 'text-slate-600 bg-slate-50 border-slate-100',
};

export function MetricCard({ label, value, sublabel, icon, accent = 'slate' }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-[#F7E4E6] bg-white p-5.5 shadow-sm premium-shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <div className={cn('rounded-xl border p-2 flex items-center justify-center', accentMap[accent])}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">{value}</p>
      {sublabel ? <p className="mt-1 text-[11px] font-medium text-slate-400">{sublabel}</p> : null}
    </div>
  );
}
