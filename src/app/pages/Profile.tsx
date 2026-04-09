import { useState } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { User, Shield, Phone, HeartPulse, Edit2, MapPin, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function Profile() {
  const { profile, loading, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    blood_group: '',
    phone: '',
    location: '',
    allergies: '',
  });

  const startEditing = () => {
    setEditData({
      name: profile?.name || '',
      age: profile?.age?.toString() || '',
      height_cm: profile?.height_cm?.toString() || '',
      weight_kg: profile?.weight_kg?.toString() || '',
      blood_group: profile?.blood_group || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      allergies: profile?.allergies?.join(', ') || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      name: editData.name || null,
      age: editData.age ? parseInt(editData.age) : null,
      height_cm: editData.height_cm ? parseFloat(editData.height_cm) : null,
      weight_kg: editData.weight_kg ? parseFloat(editData.weight_kg) : null,
      blood_group: editData.blood_group || null,
      phone: editData.phone || null,
      location: editData.location || null,
      allergies: editData.allergies ? editData.allergies.split(',').map(a => a.trim()) : [],
    });

    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Profile updated!');
      setEditing(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'IT';

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[1400px] mx-auto">
        {loading && !profile ? (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Loader2 className="mx-auto mb-4 w-10 h-10 animate-spin" />
              Loading profile...
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-[32px] font-medium text-slate-800 tracking-tight mb-1">Patient Profile</h1>
              <p className="text-sm text-slate-500">Manage your personal details and health information.</p>
            </div>
            
            {editing ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-white text-slate-700 rounded-full text-sm font-medium shadow-sm hover:text-slate-900 transition-all w-fit"
                >
                  <X className="w-4 h-4 text-slate-400" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0F3D3E] text-white rounded-full text-sm font-medium shadow-lg transition-all w-fit disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            ) : (
              <button 
                onClick={startEditing}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-white text-slate-700 rounded-full text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:text-slate-900 transition-all w-fit"
              >
                <Edit2 className="w-4 h-4 text-slate-400" /> Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main ID Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#EAF7F6] to-[#F4F7F6] -z-10" />
                
                <div className="w-28 h-28 mx-auto bg-[#0F3D3E] rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-[#0F3D3E]/20 mt-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-4xl font-semibold text-white tracking-widest -rotate-3">{initials}</span>
                </div>
                <h2 className="text-2xl font-medium text-slate-800 mb-1">{profile?.name || 'User'}</h2>
                <p className="text-sm text-slate-500 mb-6">{profile?.email}</p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EAF7F6] text-[#2EC4B6] rounded-full text-[11px] font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" /> Verified Account
                </div>
              </div>

              {/* Vitals Summary */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#2EC4B6]" /> Basic Biometrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Blood Type</span>
                    <span className="text-sm font-semibold text-[#E63946] bg-red-50 px-2 py-0.5 rounded-md">
                      {profile?.blood_group || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Height</span>
                    <span className="text-sm font-medium text-slate-800">
                      {profile?.height_cm ? `${profile.height_cm} cm` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Weight</span>
                    <span className="text-sm font-medium text-slate-800">
                      {profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Age</span>
                    <span className="text-sm font-medium text-slate-800">
                      {profile?.age ? `${profile.age} yrs` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Health Score</span>
                    <span className="text-sm font-semibold text-[#2EC4B6] bg-[#EAF7F6] px-2 py-0.5 rounded-md">
                      {profile?.health_score ?? 0}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personal Info */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8 flex items-center gap-2">
                  <User className="w-4 h-4" /> Personal Information
                </h3>
                
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Age</label>
                      <input
                        type="number"
                        value={editData.age}
                        onChange={e => setEditData(d => ({ ...d, age: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Height (cm)</label>
                      <input
                        type="number"
                        value={editData.height_cm}
                        onChange={e => setEditData(d => ({ ...d, height_cm: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        value={editData.weight_kg}
                        onChange={e => setEditData(d => ({ ...d, weight_kg: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Blood Group</label>
                      <select
                        value={editData.blood_group}
                        onChange={e => setEditData(d => ({ ...d, blood_group: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      >
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Allergies (comma separated)</label>
                      <input
                        type="text"
                        value={editData.allergies}
                        onChange={e => setEditData(d => ({ ...d, allergies: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="text-base font-medium text-slate-800">{profile?.name || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Age</label>
                      <div className="text-base font-medium text-slate-800">{profile?.age ? `${profile.age} years` : '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="text-base font-medium text-slate-800">{profile?.email || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                      <div className="text-base font-medium text-slate-800">{profile?.phone || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                      <div className="text-base font-medium text-slate-800 flex items-center gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <MapPin className="w-5 h-5 text-[#2EC4B6]" />
                        {profile?.location || 'Not set'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Allergies & Health Info */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#F28C38]" /> Allergies & Notes
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {profile?.allergies && profile.allergies.length > 0 ? (
                    profile.allergies.map((allergy, i) => (
                      <span key={i} className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium border border-orange-100">
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No known allergies recorded.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>        )}      </main>
    </div>
  );
}