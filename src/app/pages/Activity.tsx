import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { FileText, Pill, Calendar, Stethoscope, Activity as ActivityIcon, Clock } from 'lucide-react';
import { supabase, Prescription, ScheduleItem, getSupabaseSchemaHint } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  type: 'prescription' | 'medicine' | 'appointment';
  title: string;
  subtitle: string;
  date: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
}

export function Activity() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadActivity();
  }, [user]);

  async function loadActivity() {
    setLoading(true);

    const { data: rxData, error: rxError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (rxError) {
      const hint = getSupabaseSchemaHint(rxError);
      toast.error(`${rxError.message}${hint ? ` ${hint}` : ''}`);
    }

    const { data: schedData, error: schedError } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (schedError) {
      const hint = getSupabaseSchemaHint(schedError);
      toast.error(`${schedError.message}${hint ? ` ${hint}` : ''}`);
    }
    // Add prescriptions
    (rxData || []).forEach((rx: Prescription) => {
      timeline.push({
        id: rx.id,
        type: 'prescription',
        title: rx.diagnosis || 'Prescription Uploaded',
        subtitle: `Dr. ${rx.doctor_name || 'Unknown'} • ${rx.medicines?.length || 0} medicines`,
        date: rx.date || rx.created_at,
        icon: FileText,
        color: '#2EC4B6',
        bgColor: '#EAF7F6',
      });
    });

    // Add schedule items
    (schedData || []).forEach((item: ScheduleItem) => {
      if (item.type === 'medicine') {
        timeline.push({
          id: item.id,
          type: 'medicine',
          title: item.medicine_name || 'Medicine',
          subtitle: `${item.frequency} • ${item.times?.join(', ') || ''}`,
          date: item.created_at,
          icon: Pill,
          color: '#0F3D3E',
          bgColor: '#F0F4F4',
        });
      } else {
        timeline.push({
          id: item.id,
          type: 'appointment',
          title: `Appointment with Dr. ${item.doctor_name || 'Unknown'}`,
          subtitle: item.appt_datetime ? new Date(item.appt_datetime).toLocaleString() : 'No date set',
          date: item.appt_datetime || item.created_at,
          icon: Stethoscope,
          color: '#6366F1',
          bgColor: '#EEF2FF',
        });
      }
    });

    // Sort by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEvents(timeline);
    setLoading(false);
  }

  // Group events by date
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach(event => {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(event);
  });

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[32px] font-medium text-slate-800 tracking-tight mb-1">Activity Timeline</h1>
              <p className="text-sm text-slate-500">Your complete health activity history.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-[#EAF7F6] border border-[#2EC4B6]/30" />
                Prescriptions
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-[#F0F4F4] border border-[#0F3D3E]/30" />
                Medicines
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-[#EEF2FF] border border-[#6366F1]/30" />
                Appointments
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <ActivityIcon className="w-8 h-8 text-[#2EC4B6] animate-pulse" />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-16 text-center">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm text-slate-400">No activity yet. Upload a prescription to get started.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([dateStr, dayEvents]) => (
                <div key={dateStr}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {dateStr}
                  </h3>
                  <div className="relative pl-8 border-l-2 border-slate-100 space-y-4">
                    {dayEvents.map((event, i) => {
                      const Icon = event.icon;
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative"
                        >
                          {/* Timeline dot */}
                          <div
                            className="absolute -left-[41px] top-4 w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: event.color }}
                          />

                          <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_4px_15px_rgb(0,0,0,0.03)] border border-white p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: event.bgColor, color: event.color }}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-800">{event.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{event.subtitle}</p>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium shrink-0">
                                {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}