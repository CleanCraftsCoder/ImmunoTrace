import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      health_events: {
        Row: {
          id: string
          user_id: string
          date: string
          condition: string
          severity: 'low' | 'medium' | 'high'
          body_part: string
          category: string
          pattern_hint?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          condition: string
          severity: 'low' | 'medium' | 'high'
          body_part: string
          category: string
          pattern_hint?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          condition?: string
          severity?: 'low' | 'medium' | 'high'
          body_part?: string
          category?: string
          pattern_hint?: string
          created_at?: string
          updated_at?: string
        }
      }
      symptoms: {
        Row: {
          id: string
          user_id: string
          date: string
          description: string
          severity: 'mild' | 'moderate' | 'severe'
          body_part: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          description: string
          severity: 'mild' | 'moderate' | 'severe'
          body_part: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          description?: string
          severity?: 'mild' | 'moderate' | 'severe'
          body_part?: string
          created_at?: string
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string
          frequency: string
          start_date: string
          end_date?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage: string
          frequency: string
          start_date: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          dosage?: string
          frequency?: string
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      doctor_notes: {
        Row: {
          id: string
          user_id: string
          date: string
          doctor: string
          specialty: string
          notes: string
          diagnosis?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          doctor: string
          specialty: string
          notes: string
          diagnosis?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          doctor?: string
          specialty?: string
          notes?: string
          diagnosis?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          type: 'pattern' | 'preventive' | 'trend'
          title: string
          description: string
          detail: string
          confidence: number
          actionable: boolean
          suggestion: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'pattern' | 'preventive' | 'trend'
          title: string
          description: string
          detail: string
          confidence: number
          actionable: boolean
          suggestion: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'pattern' | 'preventive' | 'trend'
          title?: string
          description?: string
          detail?: string
          confidence?: number
          actionable?: boolean
          suggestion?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}