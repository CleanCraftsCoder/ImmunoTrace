import { motion } from 'motion/react';
import { Upload, FilePlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Upload,
      label: 'Upload Prescription',
      desc: 'Scan & parse documents',
      color: 'bg-[#F7F9F9] text-[#0F3D3E] border-transparent hover:border-[#2EC4B6]/30',
      action: () => {}
    },
    {
      icon: FilePlus,
      label: 'Add Health Log',
      desc: 'Record a new symptom',
      color: 'bg-[#F7F9F9] text-[#0F3D3E] border-transparent hover:border-[#2EC4B6]/30',
      action: () => {}
    },
    {
      icon: Sparkles,
      label: 'Ask HealthWise',
      desc: 'Query your health history',
      color: 'bg-[#0F3D3E] text-white border-transparent hover:bg-[#0F3D3E]/90',
      action: () => navigate('/query')
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
      <h3 className="text-base font-semibold text-[#0F3D3E] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((btn, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={btn.action}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${btn.color}`}
          >
            <div className={`mt-0.5 ${btn.label === 'Ask HealthWise' ? 'text-[#2EC4B6]' : 'text-[#0F3D3E]'}`}>
              <btn.icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-semibold mb-1 ${btn.label === 'Ask HealthWise' ? 'text-white' : 'text-[#0F3D3E]'}`}>
                {btn.label}
              </div>
              <div className={`text-xs ${btn.label === 'Ask HealthWise' ? 'text-[#2EC4B6]' : 'text-slate-500'}`}>
                {btn.desc}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}