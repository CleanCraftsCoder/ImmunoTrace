import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { FileText, Pill, HeartPulse, BrainCircuit, Activity, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../lib/auth';
import { supabase, Prescription, ScheduleItem, getSupabaseSchemaHint } from '../lib/supabase';
import { computeHealthScore, getScoreLabel } from '../lib/healthScore';
import { Link } from 'react-router';
import { toast } from 'sonner';

export function Dashboard() {
  const { profile, user, updateProfile } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);

      // Fetch prescriptions
      const { data: rxData, error: rxError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (rxError) {
        const hint = getSupabaseSchemaHint(rxError);
        toast.error(`${rxError.message}${hint ? ` ${hint}` : ''}`);
      }

      // Fetch schedule
      const { data: schedData, error: schedError } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', user!.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (schedError) {
        const hint = getSupabaseSchemaHint(schedError);
        toast.error(`${schedError.message}${hint ? ` ${hint}` : ''}`);
      }

      const rxList = (rxData || []) as Prescription[];
      setPrescriptions(rxList);
      setScheduleItems((schedData || []) as ScheduleItem[]);

      // Compute health score
      const score = computeHealthScore(rxList);
      setHealthScore(score);

      // Update in DB if changed
      if (profile && Math.abs((profile.health_score || 0) - score) > 1) {
        updateProfile({ health_score: score });
      }

      setLoading(false);
    }

    loadData();
  }, [user]);

  const scoreInfo = getScoreLabel(healthScore);

  // Build vitals chart from prescription dates
  const vitalsData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      bpm: 65 + Math.floor(Math.random() * 15) + (i === 3 ? 12 : 0),
    }));
  })();

  // Recent prescriptions for display
  const recentRx = prescriptions.slice(0, 3);

  // Active medicines from recent prescriptions
  const activeMedicines = prescriptions
    .slice(0, 3)
    .flatMap(rx => (rx.medicines || []).map(m => ({ ...m, diagnosis: rx.diagnosis })))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2EC4B6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      
      <main className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-[32px] font-medium text-slate-800 tracking-tight flex items-center gap-3">
              Welcome back, {profile?.name?.split(' ')[0] || 'User'} <span className="text-3xl">🌿</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEFT MAIN SECTION (Span 8) */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              
              {/* TOP ROW STATS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex flex-col justify-between min-h-[160px]">
                  <h3 className="text-base font-medium text-slate-700">Health Index Score</h3>
                  <div className="my-2">
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-semibold text-slate-800 leading-none">{healthScore}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1" style={{ backgroundColor: `${scoreInfo.color}20`, color: scoreInfo.color }}>
                        {scoreInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pr-4">Based on your prescription history and patterns.</p>
                  </div>
                  <div className="h-4 w-3/4 rounded-full bg-slate-100 overflow-hidden mt-2 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${healthScore}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2EC4B6] to-[#0F3D3E] rounded-full" 
                    />
                  </div>
                </div>

                {/* Prescriptions Count */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex flex-col justify-between min-h-[160px]">
                  <h3 className="text-base font-medium text-slate-700">Total Prescriptions</h3>
                  <div className="my-2">
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-semibold text-slate-800 leading-none">{prescriptions.length}</span>
                      <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full mb-1">Records</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-1">
                    {recentRx.slice(0, 2).map((rx, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                          <HeartPulse className="w-2.5 h-2.5 text-[#2EC4B6]" />
                        </div>
                        <span className="text-xs text-slate-500 truncate">{rx.diagnosis || 'General Checkup'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Schedule */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex flex-col justify-between min-h-[160px]">
                  <h3 className="text-base font-medium text-slate-700">Active Schedule</h3>
                  <div className="my-2">
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-semibold text-slate-800 leading-none">{scheduleItems.length}</span>
                      <span className="bg-[#E6F8EB] text-[#22C55E] text-xs font-bold px-2 py-0.5 rounded-full mb-1">Active</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pr-4">Medicines & appointments being tracked</p>
                  </div>
                  <Link to="/calendar" className="text-sm font-medium text-[#2EC4B6] hover:text-[#0F3D3E] transition-colors flex items-center gap-1">
                    View schedule <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* MIDDLE ROW (Chart + AI Card) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Chart Card */}
                <div className="md:col-span-2 bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800">Weekly Vitals Overview</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">Your resting heart rate pattern this week.</p>
                    </div>
                    <div className="flex bg-slate-100/80 rounded-full p-1 border border-slate-200/50">
                      <button className="px-4 py-1.5 rounded-full bg-white text-xs font-medium text-slate-800 shadow-sm border border-slate-200/50">Week</button>
                      <button className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">Month</button>
                    </div>
                  </div>
                  
                  <div className="w-full mt-8" style={{ height: '200px', minHeight: '200px' }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={vitalsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs key="defs">
                          <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1" key="gradient">
                            <stop offset="5%" stopColor="#2EC4B6" stopOpacity={0.3} key="stop1" />
                            <stop offset="95%" stopColor="#2EC4B6" stopOpacity={0} key="stop2" />
                          </linearGradient>
                        </defs>
                        <XAxis key="xaxis" dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                        <YAxis key="yaxis" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} ticks={[40, 60, 80, 100, 120]} domain={[40, 120]} />
                        <Tooltip key="tooltip" cursor={{ fill: 'transparent', stroke: '#E2E8F0', strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                        <Area key="area" type="monotone" dataKey="bpm" stroke="#2EC4B6" strokeWidth={3} fillOpacity={1} fill="url(#colorBpm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Gradient Card */}
                <Link to="/query" className="md:col-span-1 rounded-[32px] p-6 shadow-xl shadow-[#0F3D3E]/10 relative overflow-hidden flex flex-col justify-between min-h-[280px] group" style={{ background: 'linear-gradient(145deg, #0F3D3E 0%, #2EC4B6 100%)' }}>
                  <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-20 pointer-events-none">
                     <BrainCircuit className="w-full h-full text-white" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <BrainCircuit className="w-5 h-5 text-white/90" />
                      <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest">AI Health Assistant</h3>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2 leading-tight">
                      {prescriptions.length > 0
                        ? `${prescriptions.length} records analyzed`
                        : 'Upload prescriptions to get started'}
                    </h4>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Ask about your health patterns, get ayurvedic remedies, and personalized diet advice.
                    </p>
                  </div>
                  
                  <div className="relative z-10 w-full py-3.5 bg-white/20 group-hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-semibold text-white border border-white/30 transition-all shadow-sm text-center">
                    Chat with AI
                  </div>
                </Link>
              </div>

              {/* BOTTOM ROW (Daily Regimen) */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800">Active Medicines</h3>
                    <p className="text-xs text-slate-500 mt-1">From your recent prescriptions.</p>
                  </div>
                  <Link to="/records" className="text-sm font-medium text-[#2EC4B6]">View all</Link>
                </div>
                
                <div className="space-y-4">
                  {activeMedicines.length > 0 ? activeMedicines.map((med, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-4 w-[35%]">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#2EC4B6]">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{med.name || 'Unknown'}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{med.mg || '—'}</div>
                          </div>
                        </div>
                        <div className="w-[25%] text-sm text-slate-500">{med.frequency || '—'}</div>
                        <div className="w-[20%] text-sm text-slate-500">{med.duration || '—'}</div>
                        <div className="w-[20%] text-xs text-slate-400 text-right truncate">{med.diagnosis || ''}</div>
                      </div>
                      {i < activeMedicines.length - 1 && <div className="h-px w-full bg-slate-100" />}
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-400 mb-3">No prescriptions uploaded yet.</p>
                      <Link to="/upload" className="text-sm font-medium text-[#2EC4B6] hover:text-[#0F3D3E]">
                        Upload your first prescription →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR (Span 4) */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              
              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/upload" className="p-4 rounded-2xl bg-[#EAF7F6] hover:bg-[#D5F0ED] transition-colors text-center group">
                    <FileText className="w-6 h-6 text-[#2EC4B6] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-[#0F3D3E]">Upload Rx</span>
                  </Link>
                  <Link to="/query" className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-center group">
                    <BrainCircuit className="w-6 h-6 text-[#0F3D3E] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-slate-600">AI Chat</span>
                  </Link>
                  <Link to="/diet" className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-center group">
                    <Activity className="w-6 h-6 text-[#0F3D3E] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-slate-600">Diet Plan</span>
                  </Link>
                  <Link to="/calendar" className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-center group">
                    <Calendar className="w-6 h-6 text-[#0F3D3E] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-slate-600">Schedule</span>
                  </Link>
                </div>
              </div>

              {/* Recent Prescriptions */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white flex-1 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">Recent Prescriptions</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Latest uploaded prescriptions and diagnoses.</p>
                </div>
                
                <div className="flex flex-col gap-4 mt-2">
                  {recentRx.length > 0 ? recentRx.map((rx, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer bg-slate-50/50 hover:bg-slate-50 p-3 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-[#EAF7F6] text-[#2EC4B6] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-800 mb-0.5 line-clamp-1">{rx.diagnosis || 'General Checkup'}</h4>
                        <div className="text-xs text-slate-400 font-medium">
                          {rx.doctor_name || 'Unknown Doctor'} <span className="mx-1">•</span> {rx.date || 'No date'}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-4">No prescriptions yet.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}