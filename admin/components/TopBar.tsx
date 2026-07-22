import { Bell, ShieldCheck } from 'lucide-react';

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-[#F7E4E6] bg-white/70 px-10 py-4.5 backdrop-blur-md">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c2185b]">
          FabZone Admin Control
        </p>
        <h2 className="text-xl font-extrabold text-[#1A1A2D] tracking-tight editorial-header">
          Operational Center
        </h2>
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5 rounded-full border border-[#E9D5D8] bg-[#FFF0F2] px-3.5 py-1.5 text-[#c2185b]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#c2185b]" />
          <span>Security RLS Active</span>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 p-2.5 text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
