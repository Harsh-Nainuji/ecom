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
  emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  amber: 'text-amber-500 bg-amber-50 border-amber-100',
  sky: 'text-sky-500 bg-sky-50 border-sky-100',
  rose: 'text-rose-500 bg-rose-50 border-rose-100',
  slate: 'text-slate-500 bg-slate-50 border-slate-100',
};

export function MetricCard({ label, value, sublabel, icon, accent = 'slate' }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
        <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold', accentMap[accent])}>{icon}</div>
      </div>
      <p className="mt-5 text-4xl font-semibold text-slate-900">{value}</p>
      {sublabel ? <p className="mt-2 text-sm text-slate-500">{sublabel}</p> : null}
    </div>
  );
}
