"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '../lib/navItems';
import { cn } from '../lib/utils';
import { Layers, Calendar, BarChart2, Users, Settings, HelpCircle, LogOut, ArrowDownToLine } from 'lucide-react';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-full w-64 flex-col bg-white p-6">
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
      
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu
        </div>
        
        <nav className="space-y-1 mb-8">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'bg-[#fdf2f6] text-[#c2185b]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 transition-transform", isActive ? "text-[#c2185b] stroke-[2.5]" : "text-slate-400")} />
                  {label}
                </div>
                {/* Fake notification badge for mockup purposes */}
                {label === 'Orders' && (
                  <div className="rounded-full bg-[#c2185b] px-2 py-0.5 text-[9px] font-bold text-white">12+</div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          General
        </div>
        <nav className="space-y-1">
          <Link href="#" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200">
            <Settings className="h-4 w-4 text-slate-400" />
            Settings
          </Link>
          <Link href="#" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            Help
          </Link>
          <Link href="#" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 mt-2">
            <LogOut className="h-4 w-4 text-slate-400" />
            Logout
          </Link>
        </nav>
      </div>

      <div className="mt-auto pt-6">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#1a1a24] p-5 shadow-lg">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-tr from-[#c2185b] to-[#e91e63] opacity-20 blur-2xl"></div>
          <div className="relative z-10">
            <div className="mb-3 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-bold text-white text-xs">F</span>
            </div>
            <h3 className="text-white font-bold text-sm mb-1 leading-tight">Download our<br/>Mobile App</h3>
            <p className="text-slate-400 text-[10px] mb-4">Get easy in another way</p>
            <button className="w-full rounded-full bg-gradient-to-r from-[#c2185b] to-[#a01046] py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90">
              Download
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
