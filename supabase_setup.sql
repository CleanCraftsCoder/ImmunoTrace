-- =============================================
-- ImmunoTrace - Supabase Database Setup
-- =============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com → Your Project → SQL Editor
-- =============================================

-- 1. Enable extensions required by the schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  age INT,
  blood_group TEXT,
  height_cm FLOAT,
  weight_kg FLOAT,
  allergies TEXT[] DEFAULT '{}',
  location TEXT,
  phone TEXT,
  health_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  doctor_name TEXT,
  diagnosis TEXT,
  date DATE,
  medicines JSONB DEFAULT '[]',
  raw_ocr_text TEXT,
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Schedule table (medicines + appointments)
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('medicine', 'appointment')),
  medicine_name TEXT,
  times TEXT[],
  frequency TEXT DEFAULT 'daily',
  duration_days INT,
  doctor_name TEXT,
  appt_datetime TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Prescriptions: users can only access their own
CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions" ON prescriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions" ON prescriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Schedule: users can only access their own
CREATE POLICY "Users can view own schedule" ON schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule" ON schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule" ON schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule" ON schedule
  FOR DELETE USING (auth.uid() = user_id);

-- 6. pgvector similarity search function (for RAG chatbot)
CREATE OR REPLACE FUNCTION match_prescriptions(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  doctor_name TEXT,
  diagnosis TEXT,
  date DATE,
  medicines JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    prescriptions.id,
    prescriptions.user_id,
    prescriptions.doctor_name,
    prescriptions.diagnosis,
    prescriptions.date,
    prescriptions.medicines,
    1 - (prescriptions.embedding <=> query_embedding) AS similarity
  FROM prescriptions
  WHERE prescriptions.user_id = p_user_id
    AND prescriptions.embedding IS NOT NULL
    AND 1 - (prescriptions.embedding <=> query_embedding) > match_threshold
  ORDER BY prescriptions.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. Create storage bucket for prescription images
-- NOTE: Do this manually in Supabase Dashboard → Storage → New Bucket
-- Bucket name: prescription-images
-- Make it public (for image display)

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_user_id ON schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_active ON schedule(active);
