import { useParams, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Activity, Pill, AlertCircle } from 'lucide-react';
import { bodyParts } from '../data/healthData';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function DetailView() {
  const { partId } = useParams();
  const navigate = useNavigate();
  const data = bodyParts[partId || 'throat'];

  if (!data) return null;

  const chartData = [
    { month: 'Oct', issues: 1 },
    { month: 'Nov', issues: 2 },
    { month: 'Dec', issues: 1 },
    { month: 'Jan', issues: 3 },
    { month: 'Feb', issues: 2 },
    { month: 'Mar', issues: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F9] font-sans">
      <Header />
      
      <main className="md:pl-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Nav */}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-[#0F3D3E] transition-colors mb-6 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#0F3D3E]/5 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-[#0F3D3E]" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#0F3D3E] mb-2">{data.displayName} History</h1>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    Comprehensive view of recurring conditions, detected triggers, and effectiveness of past treatments.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#F7F9F9] rounded-xl p-4 border border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Incidents</div>
                      <div className="text-2xl font-bold text-[#0F3D3E]">{data.issues.length}</div>
                    </div>
                    <div className="bg-[#2EC4B6]/5 rounded-xl p-4 border border-[#2EC4B6]/20">
                      <div className="text-xs font-semibold text-[#2EC4B6] uppercase tracking-wide mb-1">Status</div>
                      <div className="text-lg font-bold text-[#2EC4B6]">Monitoring</div>
                    </div>
                  </div>

                  {/* Triggers */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-[#0F3D3E] mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400" /> Known Triggers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.triggers.map((t, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F28C38]/10 text-[#F28C38] border border-[#F28C38]/20 rounded-lg text-xs font-bold tracking-wide">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Remedies */}
                  <div>
                    <h3 className="text-sm font-bold text-[#0F3D3E] mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-slate-400" /> Past Treatments
                    </h3>
                    <ul className="space-y-2">
                      {data.remedies.map((r, i) => (
                        <li key={i} className="text-sm font-medium text-slate-600 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#2EC4B6]">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Timeline & Viz */}
              <div className="lg:col-span-8 space-y-6">
                {/* Visualizations */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#0F3D3E] mb-6">Monthly Recurrence Pattern</h3>
                  <div className="w-full" style={{ height: '256px', minHeight: '256px' }}>
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#F7F9F9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="issues" radius={[6, 6, 6, 6]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.issues > 2 ? '#E63946' : '#2EC4B6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#0F3D3E] mb-6">Detailed Occurrence History</h3>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {data.issues.map((issue, i) => (
                      <div key={issue.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0F3D3E] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-[#F7F9F9] shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-[#0F3D3E] text-sm">{issue.condition}</h4>
                            <span className="text-xs font-bold text-slate-400">{format(new Date(issue.date), 'MMM dd, yyyy')}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-500 mb-2">{issue.category}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${
                            issue.severity === 'high' ? 'text-[#E63946] border-[#E63946]/20 bg-[#E63946]/5' :
                            issue.severity === 'medium' ? 'text-[#F28C38] border-[#F28C38]/20 bg-[#F28C38]/5' :
                            'text-[#F4C430] border-[#F4C430]/30 bg-[#F4C430]/10'
                          }`}>
                            {issue.severity} Severity
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}