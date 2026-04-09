import { Activity, Home, Calendar, Stethoscope, BookOpen, MessageCircle, Heart, Flag, LogOut, UploadCloud, Salad, Clock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: MessageCircle, label: 'Chat', path: '/query' },
    { icon: Stethoscope, label: 'Records', path: '/records' },
    { icon: UploadCloud, label: 'Upload Rx', path: '/upload' },
    { icon: Salad, label: 'Diet Plan', path: '/diet' },
    { icon: Clock, label: 'Schedule', path: '/schedule' },
    { icon: BookOpen, label: 'Activity', path: '/activity' },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-24 flex flex-col items-center py-8 z-50 hidden md:flex">
      {/* Logo */}
      <Link to="/dashboard" className="mb-12 group">
        <Heart className="w-8 h-8 text-[#2EC4B6] fill-[#2EC4B6] group-hover:scale-110 transition-transform" />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname.startsWith('/detail/'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative group flex items-center justify-center w-12 h-12"
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute inset-0 bg-[#0F3D3E] rounded-full shadow-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'text-white'
                  : 'bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:text-[#2EC4B6] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)]'
              }`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="relative group flex items-center justify-center w-12 h-12 mt-2"
          title="Log Out"
        >
          <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:text-[#E63946] hover:bg-[#E63946]/5 hover:shadow-[0_4px_15px_rgba(230,57,70,0.1)]">
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </div>
        </button>
      </nav>

      {/* Bottom Icons */}
      <div className="flex flex-col gap-6 mt-auto">
        <button className="w-12 h-12 rounded-full bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] flex items-center justify-center hover:text-[#2EC4B6] transition-all">
           <span className="font-bold text-lg leading-none">?</span>
        </button>
        <Link 
          to="/profile"
          className="w-12 h-12 rounded-full bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] flex items-center justify-center hover:text-[#2EC4B6] transition-all"
          title="Profile"
        >
          <Flag className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}