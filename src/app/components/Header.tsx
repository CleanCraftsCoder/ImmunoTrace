import { Bell, Search, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function Header() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'IT';

  return (
    <header className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-4">
        <h2 className="text-[11px] font-bold text-[#2EC4B6] uppercase tracking-[0.2em]">
          ImmunoTrace
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            className="pl-9 pr-4 py-2 bg-white/60 backdrop-blur-md border border-white rounded-full text-sm text-slate-600 placeholder-slate-400 w-56 focus:outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/10 transition-all shadow-sm"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#2EC4B6] transition-colors border border-white">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#E63946] rounded-full border-2 border-[#F4F7F6]" />
        </button>

        {/* User Avatar */}
        <Link
          to="/profile"
          className="w-10 h-10 rounded-full bg-[#0F3D3E] flex items-center justify-center text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          {initials}
        </Link>

        {/* Logout */}
        <button
          onClick={async () => {
            await signOut();
            toast.success('Logged out successfully');
            navigate('/');
          }}
          className="w-10 h-10 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#E63946] transition-colors border border-white"
          title="Log Out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}