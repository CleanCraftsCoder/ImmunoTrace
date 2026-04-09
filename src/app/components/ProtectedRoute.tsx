import { Navigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#2EC4B6] to-[#0F3D3E] flex items-center justify-center shadow-lg"
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </motion.div>
          <p className="text-sm font-medium text-slate-500 tracking-wide">Loading your health data...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
