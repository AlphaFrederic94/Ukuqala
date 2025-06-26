/*
  # Initial Schema Setup for Medical App

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - full_name (text)
      - avatar_url (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - medical_records
      - id (uuid)
      - user_id (uuid, references profiles)
      - blood_group (text)
      - height (numeric)
      - weight (numeric)
      - allergies (text[])
      - medications (text[])
      - created_at (timestamp)
      - updated_at (timestamp)

    - exercise_logs
      - id (uuid)
      - user_id (uuid, references profiles)
      - exercise_type (text)
      - duration (interval)
      - calories_burned (integer)
      - notes (text)
      - created_at (timestamp)

    - nutrition_logs
      - id (uuid)
      - user_id (uuid, references profiles)
      - meal_type (text)
      - food_items (jsonb)
      - calories (integer)
      - created_at (timestamp)

    - sleep_logs
      - id (uuid)
      - user_id (uuid, references profiles)
      - sleep_time (time)
      - wake_time (time)
      - quality (integer)
      - notes (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- Update profiles table to include additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Create medical_records table
CREATE TABLE public.medical_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  blood_group text,
  height numeric,
  weight numeric,
  allergies text[],
  medications text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercise_logs table
CREATE TABLE public.exercise_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  exercise_type text NOT NULL,
  duration interval NOT NULL,
  calories_burned integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create nutrition_logs table
CREATE TABLE public.nutrition_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  meal_type text NOT NULL,
  food_items jsonb NOT NULL,
  calories integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sleep_logs table
CREATE TABLE public.sleep_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  sleep_time time NOT NULL,
  wake_time time NOT NULL,
  quality integer CHECK (quality >= 1 AND quality <= 5),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Users can update own medical records" ON public.medical_records;

-- Create updated policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own medical records"
  ON public.medical_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records"
  ON public.medical_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records"
  ON public.medical_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own exercise logs"
  ON public.exercise_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own nutrition logs"
  ON public.nutrition_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sleep logs"
  ON public.sleep_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Make sure the profiles table has all required columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Make sure medical_records table has correct structure
ALTER TABLE public.medical_records 
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS height numeric,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS allergies text[],
  ADD COLUMN IF NOT EXISTS medications text[];

-- Update medical_records table to include all health metrics
ALTER TABLE public.medical_records 
  ADD COLUMN IF NOT EXISTS height decimal(5,2),
  ADD COLUMN IF NOT EXISTS current_weight decimal(5,2),
  ADD COLUMN IF NOT EXISTS target_weight decimal(5,2),
  ADD COLUMN IF NOT EXISTS bmi decimal(4,2),
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS activity_level text,
  ADD COLUMN IF NOT EXISTS health_conditions text[],
  ADD COLUMN IF NOT EXISTS last_checkup_date date;

-- Create function to automatically calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.height IS NOT NULL AND NEW.current_weight IS NOT NULL AND NEW.height > 0 THEN
    NEW.bmi := ROUND((NEW.current_weight / ((NEW.height / 100) * (NEW.height / 100)))::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update BMI when weight or height changes
DROP TRIGGER IF EXISTS update_bmi ON public.medical_records;
CREATE TRIGGER update_bmi
  BEFORE INSERT OR UPDATE OF height, current_weight
  ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bmi();

-- Create function to calculate age from date_of_birth
CREATE OR REPLACE FUNCTION calculate_age()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age := DATE_PART('year', AGE(NEW.date_of_birth));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update age when date_of_birth changes
DROP TRIGGER IF EXISTS update_age ON public.medical_records;
CREATE TRIGGER update_age
  BEFORE INSERT OR UPDATE OF date_of_birth
  ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_age();
