import { Bell, ShieldCheck } from 'lucide-react';

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-10 py-5 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-amber-600">FabZone Admin</p>
        <h2 className="text-2xl font-semibold text-slate-900">Operational Dashboard</h2>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>RLS Active</span>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 p-3 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
