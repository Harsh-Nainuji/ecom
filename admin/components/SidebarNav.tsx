"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '../lib/navItems';
import { cn } from '../lib/utils';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-full w-64 flex-col bg-white p-6 justify-between">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#c2185b] to-[#e91e63] flex items-center justify-center shadow-md">
            <span className="font-extrabold text-white text-sm tracking-widest">F</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 editorial-header">
              FabZone
            </h1>
          </div>
        </div>
        
        <div className="overflow-y-auto pr-2">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </div>
          
          <nav className="space-y-1">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive 
                      ? 'bg-[#fdf2f6] text-[#c2185b]' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-transform", isActive ? "text-[#c2185b] stroke-[2.5]" : "text-slate-400")} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-4 mt-auto">
        FabZone Admin Center &copy; 2026
      </div>
    </aside>
  );
}
