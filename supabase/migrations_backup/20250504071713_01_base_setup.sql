-- Medical Students Hub Database Schema for Supabase
-- Module 1: Base Setup - Schema, Extensions, and Core Tables

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create schema for Medical Students Hub
CREATE SCHEMA IF NOT EXISTS students_hub;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- USERS TABLE (if not exists)
-- ===============================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- SUBJECTS TABLE
-- ===============================
CREATE TABLE students_hub.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- STUDY SESSIONS TABLE
-- ===============================
CREATE TABLE students_hub.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in minutes
  module VARCHAR(50) NOT NULL, -- 'flashcards', 'mcq', 'notes', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- SEED DATA - SUBJECTS
-- ===============================

-- Insert some default subjects
INSERT INTO students_hub.subjects (name, description)
VALUES
  ('Anatomy', 'Study of the structure of organisms and their parts'),
  ('Physiology', 'Study of the normal function of living systems'),
  ('Pathology', 'Study of the causes and effects of disease or injury'),
  ('Pharmacology', 'Study of drug action'),
  ('Biochemistry', 'Study of chemical processes within and relating to living organisms'),
  ('Microbiology', 'Study of microorganisms'),
  ('Immunology', 'Study of the immune system'),
  ('Neurology', 'Study of the nervous system'),
  ('Cardiology', 'Study of the heart and cardiovascular system'),
  ('Pulmonology', 'Study of the respiratory system')
ON CONFLICT (name) DO NOTHING;

-- ===============================
-- INDEXES FOR BASE TABLES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON students_hub.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON students_hub.study_sessions(start_time);

-- ===============================
-- RLS POLICIES FOR BASE TABLES
-- ===============================
ALTER TABLE students_hub.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_sessions_select_policy ON students_hub.study_sessions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY study_sessions_insert_policy ON students_hub.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY study_sessions_update_policy ON students_hub.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY study_sessions_delete_policy ON students_hub.study_sessions
  FOR DELETE USING (auth.uid() = user_id);
