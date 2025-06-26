-- Fix medical_records table schema to ensure all required columns exist
-- This migration ensures the table has the correct schema for onboarding

-- Add missing columns if they don't exist
ALTER TABLE public.medical_records 
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5),
  ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS current_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS health_conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the table has proper constraints
ALTER TABLE public.medical_records 
  ADD CONSTRAINT IF NOT EXISTS medical_records_user_id_unique UNIQUE (user_id);

-- Create or replace the upsert function for better conflict resolution
CREATE OR REPLACE FUNCTION upsert_medical_records(
  p_user_id UUID,
  p_blood_group VARCHAR(5) DEFAULT NULL,
  p_height NUMERIC(5,2) DEFAULT NULL,
  p_current_weight NUMERIC(5,2) DEFAULT NULL,
  p_target_weight NUMERIC(5,2) DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender VARCHAR(20) DEFAULT NULL,
  p_activity_level VARCHAR(20) DEFAULT NULL,
  p_allergies TEXT[] DEFAULT '{}',
  p_medications TEXT[] DEFAULT '{}',
  p_health_conditions TEXT[] DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.medical_records (
    user_id, blood_group, height, current_weight, target_weight,
    date_of_birth, gender, activity_level, allergies, medications,
    health_conditions, created_at, updated_at
  ) VALUES (
    p_user_id, p_blood_group, p_height, p_current_weight, p_target_weight,
    p_date_of_birth, p_gender, p_activity_level, p_allergies, p_medications,
    p_health_conditions, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    blood_group = COALESCE(EXCLUDED.blood_group, medical_records.blood_group),
    height = COALESCE(EXCLUDED.height, medical_records.height),
    current_weight = COALESCE(EXCLUDED.current_weight, medical_records.current_weight),
    target_weight = COALESCE(EXCLUDED.target_weight, medical_records.target_weight),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, medical_records.date_of_birth),
    gender = COALESCE(EXCLUDED.gender, medical_records.gender),
    activity_level = COALESCE(EXCLUDED.activity_level, medical_records.activity_level),
    allergies = COALESCE(EXCLUDED.allergies, medical_records.allergies),
    medications = COALESCE(EXCLUDED.medications, medical_records.medications),
    health_conditions = COALESCE(EXCLUDED.health_conditions, medical_records.health_conditions),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION upsert_medical_records TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_medical_records TO service_role;
