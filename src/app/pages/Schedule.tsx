import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Calendar, Clock, Pill, Stethoscope, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

interface ScheduleItem {
  id: string;
  type: 'medicine' | 'appointment';
  medicine_name?: string;
  times?: string[];
  frequency?: string;
  duration_days?: number;
  doctor_name?: string;
  appt_datetime?: string;
  active: boolean;
}

export function Schedule() {
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState({
    type: 'medicine' as 'medicine' | 'appointment',
    medicine_name: '',
    times: [''],
    frequency: 'daily',
    duration_days: 7,
    doctor_name: '',
    appt_datetime: '',
  });

  useEffect(() => {
    if (user) loadSchedule();
  }, [user]);

  async function loadSchedule() {
    setLoading(true);
    const { data } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', user!.id)
      .eq('active', true)
      .order('created_at', { ascending: false });

    setItems(data || []);
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!user) return;

    const item = {
      user_id: user.id,
      type: form.type,
      active: true,
      ...(form.type === 'medicine' ? {
        medicine_name: form.medicine_name,
        times: form.times.filter(t => t),
        frequency: form.frequency,
        duration_days: form.duration_days,
      } : {
        doctor_name: form.doctor_name,
        appt_datetime: form.appt_datetime,
      }),
    };

    const { error } = await supabase.from('schedule').insert(item);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Added to schedule!');
      loadSchedule();
      setShowAdd(false);
      setForm({
        type: 'medicine',
        medicine_name: '',
        times: [''],
        frequency: 'daily',
        duration_days: 7,
        doctor_name: '',
        appt_datetime: '',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('schedule')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Removed from schedule');
      loadSchedule();
    }
  };

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">My Schedule</h1>
              <p className="text-slate-600">Medicine reminders and appointment tracking</p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-6 py-3 bg-[#2EC4B6] hover:bg-[#25A89B] text-white rounded-full font-medium shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showAdd ? 'Cancel' : 'Add Reminder'}
            </button>
          </div>

          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-xl font-semibold mb-4">Add New Reminder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'medicine' | 'appointment' })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                  >
                    <option value="medicine">Medicine Reminder</option>
                    <option value="appointment">Doctor Appointment</option>
                  </select>
                </div>
                {form.type === 'medicine' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Medicine Name</label>
                      <input
                        type="text"
                        value={form.medicine_name}
                        onChange={(e) => setForm({ ...form, medicine_name: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                        placeholder="e.g. Paracetamol"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Times (comma separated)</label>
                      <input
                        type="text"
                        value={form.times.join(', ')}
                        onChange={(e) => setForm({ ...form, times: e.target.value.split(',').map(t => t.trim()) })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                        placeholder="e.g. 8:00 AM, 2:00 PM, 8:00 PM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                      <select
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                      >
                        <option value="daily">Daily</option>
                        <option value="twice daily">Twice Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Duration (days)</label>
                      <input
                        type="number"
                        value={form.duration_days}
                        onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Doctor Name</label>
                      <input
                        type="text"
                        value={form.doctor_name}
                        onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Appointment Date & Time</label>
                      <input
                        type="datetime-local"
                        value={form.appt_datetime}
                        onChange={(e) => setForm({ ...form, appt_datetime: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2EC4B6] focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleAdd}
                className="px-6 py-3 bg-[#2EC4B6] hover:bg-[#25A89B] text-white rounded-xl font-medium shadow-lg transition-all"
              >
                Add to Schedule
              </button>
            </motion.div>
          )}

          {loading ? (
            <div className="text-center py-12">Loading schedule...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No active reminders or appointments.
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {item.type === 'medicine' ? (
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Pill className="w-6 h-6 text-blue-600" />
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 rounded-xl">
                          <Stethoscope className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">
                          {item.type === 'medicine' ? item.medicine_name : `Appointment with ${item.doctor_name}`}
                        </h3>
                        {item.type === 'medicine' ? (
                          <div className="text-sm text-slate-600 space-y-1">
                            <div>Times: {item.times?.join(', ')}</div>
                            <div>Frequency: {item.frequency}</div>
                            <div>Duration: {item.duration_days} days</div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600">
                            {new Date(item.appt_datetime!).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}