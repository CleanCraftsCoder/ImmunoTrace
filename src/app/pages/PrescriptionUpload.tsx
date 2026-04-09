import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import {
  UploadCloud,
  Camera,
  FileImage,
  Check,
  Edit3,
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { supabase, Medicine, getSupabaseSchemaHint } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

interface ExtractedData {
  doctor_name: string;
  diagnosis: string;
  date: string;
  medicines: Medicine[];
}

export function PrescriptionUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<ExtractedData>({
    doctor_name: '',
    diagnosis: '',
    date: new Date().toISOString().split('T')[0],
    medicines: [{ name: '', mg: '', frequency: '', duration: '' }],
  });

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Upload image and run OCR
  const handleUploadAndOCR = async () => {
    if (!imageFile) {
      toast.error('Please select an image before scanning.');
      return;
    }

    if (!user) {
      toast.error('Please sign in before uploading a prescription.');
      return;
    }

    setStep('processing');
    setUploading(true);

    try {
      // 1. Convert image to base64 and upload via backend (uses service role to bypass RLS)
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = (e.target?.result as string)?.split(',')[1];
          const uploadResponse = await fetch(`${API_URL}/api/upload/prescription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: imageFile.name,
              userId: user.id,
            }),
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            toast.error(`Upload failed: ${errorData.error}`);
            setStep('review');
            setUploading(false);
            return;
          }

          const uploadData = await uploadResponse.json();
          setImageUrl(uploadData.publicUrl);

          // 2. Call OCR API
          try {
            const response = await fetch(`${API_URL}/api/ocr`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: uploadData.publicUrl }),
            });

            if (response.ok) {
              const ocrData = await response.json();
              setExtracted({
                doctor_name: ocrData.doctor_name || '',
                diagnosis: ocrData.diagnosis || '',
                date: ocrData.date || new Date().toISOString().split('T')[0],
                medicines: ocrData.medicines?.length
                  ? ocrData.medicines
                  : [{ name: '', mg: '', frequency: '', duration: '' }],
              });
              toast.success('Prescription scanned! Please review the extracted data.');
            } else {
              toast.info('OCR service unavailable. Please enter data manually.');
            }
          } catch {
            toast.info('OCR server not running. Enter data manually.');
          }

          setUploading(false);
          setStep('review');
        } catch (err) {
          console.error('Upload processing error:', err);
          toast.error('Upload failed. Please try again.');
          setUploading(false);
          setStep('review');
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setStep('review');
    }
  };

  // Save prescription to DB
  const handleSave = async (addAnother: boolean) => {
    if (!user) return;
    setSaving(true);

    // 1. Ensure user profile exists (fix for FK constraint)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user doesn't exist)
      console.error('Error checking user profile:', checkError);
    }

    if (!existingUser) {
      // User profile doesn't exist, create it
      const { error: createUserError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email || '',
        name: null,
        age: null,
        blood_group: null,
        height_cm: null,
        weight_kg: null,
        allergies: [],
        location: null,
        phone: null,
        health_score: 0,
      });

      if (createUserError) {
        setSaving(false);
        console.error('Error creating user profile:', createUserError);
        toast.error('Could not create user profile. Please ensure you are signed in and try again.');
        return;
      }
    }

    // 2. Now insert the prescription
    const { error } = await supabase.from('prescriptions').insert({
      user_id: user.id,
      image_url: imageUrl,
      doctor_name: extracted.doctor_name || null,
      diagnosis: extracted.diagnosis || null,
      date: extracted.date || null,
      medicines: extracted.medicines.filter(m => m.name),
      raw_ocr_text: JSON.stringify(extracted),
    });

    setSaving(false);

    if (error) {
      const hint = getSupabaseSchemaHint(error);
      toast.error(`${error.message}${hint ? ` ${hint}` : ''}`);
      return;
    }

    // Try to generate embedding (non-blocking)
    try {
      const text = `${extracted.diagnosis} ${extracted.medicines.map(m => `${m.name} ${m.mg}`).join(' ')}`;
      fetch(`${API_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: user.id }),
      }).catch(() => {});
    } catch {}

    toast.success('Prescription saved!');

    if (addAnother) {
      // Reset for another upload
      setStep('upload');
      setImageFile(null);
      setImagePreview(null);
      setImageUrl(null);
      setExtracted({
        doctor_name: '',
        diagnosis: '',
        date: new Date().toISOString().split('T')[0],
        medicines: [{ name: '', mg: '', frequency: '', duration: '' }],
      });
    } else {
      navigate('/dashboard');
    }
  };

  // Add/remove medicine rows
  const addMedicine = () => {
    setExtracted(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', mg: '', frequency: '', duration: '' }],
    }));
  };

  const removeMedicine = (index: number) => {
    setExtracted(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    setExtracted(prev => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  };

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="text-[32px] font-medium text-slate-800 tracking-tight mb-1">
              Upload Prescription
            </h1>
            <p className="text-sm text-slate-500">
              Upload a photo or scan of your prescription. Our AI will extract the details for you.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            {['Upload', 'AI Scan', 'Review & Save'].map((label, i) => {
              const stepIndex = i;
              const currentIndex = step === 'upload' ? 0 : step === 'processing' ? 1 : 2;
              const isCompleted = stepIndex < currentIndex;
              const isCurrent = stepIndex === currentIndex;

              return (
                <div key={label} className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0
                      ${isCompleted ? 'bg-[#2EC4B6] text-white' : isCurrent ? 'bg-[#0F3D3E] text-white' : 'bg-slate-100 text-slate-400'}
                    `}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${isCurrent ? 'text-slate-800' : 'text-slate-400'}`}
                  >
                    {label}
                  </span>
                  {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Upload */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-2 border-dashed border-slate-200 hover:border-[#2EC4B6] p-12 text-center transition-all cursor-pointer"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />

                  {imagePreview ? (
                    <div className="space-y-6">
                      <img
                        src={imagePreview}
                        alt="Prescription preview"
                        className="max-h-[400px] mx-auto rounded-2xl shadow-lg object-contain"
                      />
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4 inline mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-[24px] bg-[#EAF7F6] text-[#2EC4B6] flex items-center justify-center">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 mb-1">
                          Drop your prescription here
                        </h3>
                        <p className="text-sm text-slate-500">
                          or click to browse • JPG, PNG, HEIC supported
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mt-4">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-4 h-4" /> Take Photo
                        </div>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-1.5">
                          <FileImage className="w-4 h-4" /> Gallery
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 mt-6"
                  >
                    <button
                      onClick={handleUploadAndOCR}
                      disabled={!user || uploading}
                      className={`flex-1 py-4 rounded-2xl font-semibold shadow-[0_8px_20px_rgba(46,196,182,0.3)] transition-all flex items-center justify-center gap-2 ${
                        !user || uploading
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#2EC4B6] to-[#20A498] hover:from-[#27B4A6] hover:to-[#1B9489] text-white'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" /> Scan with AI
                    </button>
                    <button
                      onClick={() => setStep('review')}
                      className="px-6 py-4 bg-white/80 border border-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-5 h-5" /> Enter Manually
                    </button>
                  </motion.div>
                )}

                {/* Manual entry without image */}
                <button
                  onClick={() => setStep('review')}
                  className="w-full mt-4 py-3 text-sm font-medium text-slate-500 hover:text-[#2EC4B6] transition-colors"
                >
                  Skip image upload → Enter prescription manually
                </button>
              </motion.div>
            )}

            {/* STEP 2: Processing */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-16 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6"
                >
                  <Loader2 className="w-20 h-20 text-[#2EC4B6]" />
                </motion.div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">
                  AI is reading your prescription...
                </h3>
                <p className="text-sm text-slate-500">
                  Extracting doctor name, diagnosis, medicines, and dosage.
                </p>
              </motion.div>
            )}

            {/* STEP 3: Review & Edit */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-800">Review Extracted Data</h3>
                    <span className="text-xs font-bold text-[#2EC4B6] bg-[#EAF7F6] px-3 py-1 rounded-full">
                      Editable
                    </span>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        value={extracted.doctor_name}
                        onChange={(e) =>
                          setExtracted((p) => ({ ...p, doctor_name: e.target.value }))
                        }
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Diagnosis
                      </label>
                      <input
                        type="text"
                        value={extracted.diagnosis}
                        onChange={(e) =>
                          setExtracted((p) => ({ ...p, diagnosis: e.target.value }))
                        }
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                        placeholder="e.g. Viral Fever"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={extracted.date}
                        onChange={(e) =>
                          setExtracted((p) => ({ ...p, date: e.target.value }))
                        }
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Medicines */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Medicines
                      </label>
                      <button
                        onClick={addMedicine}
                        className="flex items-center gap-1 text-sm font-medium text-[#2EC4B6] hover:text-[#0F3D3E] transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Medicine
                      </button>
                    </div>

                    <div className="space-y-3">
                      {extracted.medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                            className="col-span-4 px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-[#2EC4B6] text-sm text-slate-800"
                            placeholder="Medicine name"
                          />
                          <input
                            type="text"
                            value={med.mg}
                            onChange={(e) => updateMedicine(index, 'mg', e.target.value)}
                            className="col-span-2 px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-[#2EC4B6] text-sm text-slate-800"
                            placeholder="500mg"
                          />
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                            className="col-span-3 px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-[#2EC4B6] text-sm text-slate-800"
                            placeholder="3x daily"
                          />
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                            className="col-span-2 px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none focus:border-[#2EC4B6] text-sm text-slate-800"
                            placeholder="5 days"
                          />
                          <button
                            onClick={() => removeMedicine(index)}
                            className="col-span-1 p-2 text-slate-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex-1 py-4 bg-white/80 border border-[#2EC4B6] text-[#0F3D3E] rounded-2xl font-semibold hover:bg-[#EAF7F6] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    Save & Add Another
                  </button>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex-1 py-4 bg-gradient-to-r from-[#2EC4B6] to-[#20A498] text-white rounded-2xl font-semibold shadow-[0_8px_20px_rgba(46,196,182,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                    Save & Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
