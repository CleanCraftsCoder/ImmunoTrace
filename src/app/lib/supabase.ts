import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
  throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file. Get them from https://supabase.com → Project Settings → API');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ────────────────────────────────────────
// Type definitions matching the DB schema
// ────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  allergies: string[] | null;
  location: string | null;
  phone: string | null;
  health_score: number;
  created_at: string;
}

export interface Medicine {
  name: string;
  mg: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  image_url: string | null;
  doctor_name: string | null;
  diagnosis: string | null;
  date: string | null;
  medicines: Medicine[];
  raw_ocr_text: string | null;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  user_id: string;
  type: 'medicine' | 'appointment';
  medicine_name: string | null;
  times: string[] | null;
  frequency: string;
  duration_days: number | null;
  doctor_name: string | null;
  appt_datetime: string | null;
  active: boolean;
  created_at: string;
}

export function getSupabaseSchemaHint(error: any) {
  if (!error) return '';

  const payload = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
  if (
    payload.includes('404') ||
    payload.includes('not found') ||
    payload.includes('does not exist') ||
    payload.includes('relation')
  ) {
    return 'This usually means the Supabase table is missing or not created. Run `supabase_setup.sql` in the Supabase SQL editor to create the required tables.';
  }

  return '';
}
