import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus, Pill, Stethoscope, X, Loader2 } from 'lucide-react';
import { supabase, ScheduleItem } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function CalendarPage() {
  const { user } = useAuth();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'medicine' | 'appointment'>('medicine');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: '',
    times: '',
    frequency: 'daily',
    duration_days: '',
    doctor_name: '',
    appt_datetime: '',
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (!user) return;
    loadSchedule();
  }, [user]);

  async function loadSchedule() {
    const { data } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setScheduleItems((data || []) as ScheduleItem[]);
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const item: Record<string, unknown> = {
      user_id: user.id,
      type: formType,
      active: true,
    };

    if (formType === 'medicine') {
      item.medicine_name = formData.medicine_name;
      item.times = formData.times.split(',').map(t => t.trim());
      item.frequency = formData.frequency;
      item.duration_days = parseInt(formData.duration_days) || null;
    } else {
      item.doctor_name = formData.doctor_name;
      item.appt_datetime = formData.appt_datetime || null;
    }

    const { error } = await supabase.from('schedule').insert(item);
    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${formType === 'medicine' ? 'Medicine' : 'Appointment'} added!`);
      setShowForm(false);
      setFormData({ medicine_name: '', times: '', frequency: 'daily', duration_days: '', doctor_name: '', appt_datetime: '' });
      loadSchedule();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('schedule').update({ active: !active }).eq('id', id);
    loadSchedule();
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[32px] font-medium text-slate-800 tracking-tight mb-1">Schedule & Calendar</h1>
              <p className="text-sm text-slate-500">Manage medicine schedules and doctor appointments.</p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-[#0F3D3E] hover:bg-[#1A595A] text-white rounded-full text-sm font-medium shadow-lg shadow-[#0F3D3E]/20 transition-all z-10 relative flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>

          {/* Add Form Modal */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-lg border border-white p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-800">Add Schedule Item</h3>
                <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setFormType('medicine')}
                  className={`flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    formType === 'medicine' ? 'bg-[#0F3D3E] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Pill className="w-4 h-4" /> Medicine
                </button>
                <button
                  onClick={() => setFormType('appointment')}
                  className={`flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    formType === 'appointment' ? 'bg-[#0F3D3E] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" /> Appointment
                </button>
              </div>

              {formType === 'medicine' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Medicine name" value={formData.medicine_name}
                    onChange={e => setFormData(d => ({ ...d, medicine_name: e.target.value }))}
                    className="px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] text-sm" />
                  <input type="text" placeholder="Times (e.g. 8:00 AM, 2:00 PM)" value={formData.times}
                    onChange={e => setFormData(d => ({ ...d, times: e.target.value }))}
                    className="px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] text-sm" />
                  <select value={formData.frequency} onChange={e => setFormData(d => ({ ...d, frequency: e.target.value }))}
                    className="px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] text-sm">
                    <option value="daily">Daily</option>
                    <option value="alternate">Alternate Days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <input type="number" placeholder="Duration (days)" value={formData.duration_days}
                    onChange={e => setFormData(d => ({ ...d, duration_days: e.target.value }))}
                    className="px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] text-sm" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Doctor name" value={formData.doctor_name}
                    onChange={e => setFormData(d => ({ ...d, doctor_name: e.target.value }))}
                    className="px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] text-sm" />
                  <input type="datetime-local" value={formData.appt_datetime}
                    onChange={e => setFormData(d => ({ ...d, appt_datetime: e.target.value }))}
                    className="px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] text-sm" />
                </div>
              )}

              <button onClick={handleSave} disabled={saving}
                className="w-full mt-4 py-3 bg-[#2EC4B6] hover:bg-[#27B4A6] text-white rounded-2xl font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add to Schedule
              </button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Calendar Grid */}
            <div className="lg:col-span-3 bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white overflow-hidden p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-medium text-slate-800">{monthNames[currentMonth]} {currentYear}</h2>
                <div className="flex items-center gap-2 bg-slate-50/50 rounded-full p-1 border border-slate-100">
                  <button onClick={prevMonth} className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextMonth} className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-fr gap-2 md:gap-3">
                {calendarDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[80px] md:min-h-[100px] rounded-2xl p-2 md:p-3 transition-all ${
                      day 
                        ? isToday(day) 
                          ? 'bg-[#EAF7F6] border border-[#2EC4B6]/30' 
                          : 'bg-slate-50/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100' 
                        : 'opacity-0'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                          isToday(day) ? 'bg-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/30' : 'text-slate-700'
                        }`}>
                          {day}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar List */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6 md:p-8">
                <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#2EC4B6]" /> Schedule
                </h3>
                
                <div className="space-y-4">
                  {scheduleItems.length > 0 ? scheduleItems.map((item) => (
                    <div key={item.id} className={`p-4 rounded-2xl border shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all ${
                      item.active ? 'bg-white border-slate-100 hover:border-[#2EC4B6]/30' : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-800">
                          {item.type === 'medicine' ? item.medicine_name : `Dr. ${item.doctor_name}`}
                        </h4>
                        <button
                          onClick={() => toggleActive(item.id, item.active)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                            item.active ? 'text-[#22C55E] bg-[#E6F8EB]' : 'text-slate-400 bg-slate-100'
                          }`}
                        >
                          {item.active ? 'Active' : 'Done'}
                        </button>
                      </div>
                      {item.type === 'medicine' ? (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {item.times?.join(', ') || 'No time set'} • {item.frequency}
                          {item.duration_days && ` • ${item.duration_days} days`}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {item.appt_datetime ? new Date(item.appt_datetime).toLocaleString() : 'No date set'}
                        </div>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-4">No schedule items yet.</p>
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