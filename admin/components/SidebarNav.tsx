"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '../lib/navItems';
import { cn } from '../lib/utils';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/10 bg-slate-950 p-6 text-slate-200">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">FabZone</p>
        <h1 className="text-2xl font-semibold text-white">Admin</h1>
        <p className="text-xs text-slate-400">Marketplace control center</p>
      </div>
      <nav className="space-y-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
