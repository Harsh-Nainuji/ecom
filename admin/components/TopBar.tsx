import { Bell, Search, Mail } from 'lucide-react';

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-50">
      {/* Search Bar */}
      <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2.5 transition-colors focus-within:border-slate-200 focus-within:bg-white shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 shadow-sm"
        >
          <Mail className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 shadow-sm"
        >
          <div className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-rose-500"></span>
          </div>
        </button>
        
        {/* Profile */}
        <div className="ml-2 flex items-center gap-3 border-l border-slate-150 pl-4">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm">
            <span className="text-xs font-black text-slate-600">A</span>
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-bold text-slate-800">System Admin</span>
            <span className="text-[10px] text-slate-400">Control Panel</span>
          </div>
        </div>
      </div>
    </header>
  );
}
