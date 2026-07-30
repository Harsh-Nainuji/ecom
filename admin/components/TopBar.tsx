import { Bell, Search, Mail, User } from 'lucide-react';

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-white">
      {/* Search Bar */}
      <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2.5 transition-colors focus-within:border-slate-200 focus-within:bg-white shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search task" 
          className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <div className="flex items-center justify-center rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
          ⌘F
        </div>
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
        <div className="ml-2 flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-md bg-slate-200">
            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="h-full w-full object-cover" />
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-bold text-slate-800">Totok Michael</span>
            <span className="text-xs text-slate-500">tmichael20@mail.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
