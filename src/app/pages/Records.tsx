import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { FileText, Download, MoreVertical, Filter, UploadCloud, Eye, Edit3, Loader2 } from 'lucide-react';
import { supabase, Prescription, getSupabaseSchemaHint } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router';
import { toast } from 'sonner';

export function Records() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    loadRecords();
  }, [user]);

  async function loadRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });

    if (error) {
      const hint = getSupabaseSchemaHint(error);
      toast.error(`${error.message}${hint ? ` ${hint}` : ''}`);
    }

    setPrescriptions((data || []) as Prescription[]);
    setLoading(false);
  }

  const filtered = filter
    ? prescriptions.filter(p =>
        p.diagnosis?.toLowerCase().includes(filter.toLowerCase()) ||
        p.doctor_name?.toLowerCase().includes(filter.toLowerCase())
      )
    : prescriptions;

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[32px] font-medium text-slate-800 tracking-tight mb-1">Health Log</h1>
              <p className="text-sm text-slate-500">Complete history of all your uploaded prescriptions.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by diagnosis or doctor..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-white text-slate-700 rounded-full text-sm shadow-sm outline-none focus:border-[#2EC4B6] w-64"
                />
              </div>
              <Link to="/upload" className="flex items-center gap-2 px-6 py-2.5 bg-[#0F3D3E] hover:bg-[#1A595A] text-white rounded-full text-sm font-medium shadow-lg shadow-[#0F3D3E]/20 transition-all">
                <UploadCloud className="w-4 h-4" /> Upload New
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#2EC4B6] animate-spin" />
            </div>
          ) : (
            <>
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white overflow-hidden p-2">
                {filtered.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diagnosis</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doctor</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medicines</th>
                          <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {filtered.map((rx, i) => (
                          <motion.tr 
                            key={rx.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#EAF7F6] text-[#2EC4B6] flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-800">{rx.diagnosis || 'General'}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">{rx.medicines?.length || 0} medicines</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm font-medium text-slate-600">{rx.doctor_name || '—'}</td>
                            <td className="px-6 py-5 text-sm font-medium text-slate-600">{rx.date || '—'}</td>
                            <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-1">
                                {rx.medicines?.slice(0, 2).map((m, mi) => (
                                  <span key={mi} className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500">
                                    {m.name}
                                  </span>
                                ))}
                                {(rx.medicines?.length || 0) > 2 && (
                                  <span className="text-[10px] text-slate-400 px-1">+{rx.medicines!.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setSelectedRx(rx)}
                                  className="p-2.5 text-slate-400 hover:text-[#2EC4B6] bg-white border border-slate-100 rounded-xl shadow-sm transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 mb-3">
                      {filter ? 'No records match your filter.' : 'No prescriptions uploaded yet.'}
                    </p>
                    <Link to="/upload" className="text-sm font-medium text-[#2EC4B6]">Upload your first prescription →</Link>
                  </div>
                )}
              </div>

              {/* Detail Modal */}
              {selectedRx && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                  onClick={() => setSelectedRx(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-medium text-slate-800">Prescription Details</h3>
                      <button onClick={() => setSelectedRx(null)} className="text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Doctor</span>
                          <p className="text-sm font-medium text-slate-800 mt-1">{selectedRx.doctor_name || '—'}</p>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Date</span>
                          <p className="text-sm font-medium text-slate-800 mt-1">{selectedRx.date || '—'}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Diagnosis</span>
                        <p className="text-sm font-medium text-slate-800 mt-1">{selectedRx.diagnosis || '—'}</p>
                      </div>

                      {selectedRx.image_url && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Prescription Image</span>
                          <img src={selectedRx.image_url} alt="Prescription" className="mt-2 rounded-2xl max-h-48 object-contain border" />
                        </div>
                      )}

                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Medicines</span>
                        <div className="mt-2 space-y-2">
                          {selectedRx.medicines?.map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <span className="text-sm font-medium text-slate-800">{m.name}</span>
                              <div className="text-xs text-slate-500">
                                {m.mg} • {m.frequency} • {m.duration}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}