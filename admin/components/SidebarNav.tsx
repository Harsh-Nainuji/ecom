"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '../lib/navItems';
import { cn } from '../lib/utils';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-brand-border bg-[#0E0E17] p-6 text-slate-200">
      <div className="mb-10 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#c2185b] to-[#e91e63] flex items-center justify-center font-bold text-white tracking-widest text-sm shadow-md">
          F
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white editorial-header">
            FabZone <span className="text-[#c2185b] text-xs">Admin</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Control Center
          </p>
        </div>
      </div>
      
      <div className="mb-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Navigation
      </div>
      
      <nav className="space-y-1.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                isActive 
                  ? 'bg-gradient-to-r from-[#c2185b]/15 to-transparent text-[#ff6090] border-l-2 border-[#c2185b] pl-4 sidebar-glow' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] pl-3',
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform", isActive ? "scale-110 text-[#ff6090]" : "text-slate-500")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
          <p className="text-[10px] text-slate-400">Environment</p>
          <p className="text-xs font-bold text-emerald-400">Production Ready</p>
        </div>
      </div>
    </aside>
  );
}
