-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create medical_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blood_group VARCHAR(5),
    height NUMERIC(5,2),
    current_weight NUMERIC(5,2),
    target_weight NUMERIC(5,2),
    date_of_birth DATE,
    gender VARCHAR(20),
    activity_level VARCHAR(20),
    allergies TEXT[] DEFAULT '{}',
    medications TEXT[] DEFAULT '{}',
    health_conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own medical records"
    ON public.medical_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical records"
    ON public.medical_records FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical records"
    ON public.medical_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS medical_records_user_id_idx ON public.medical_records(user_id);
