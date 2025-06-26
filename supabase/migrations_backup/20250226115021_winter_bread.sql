/*
  # Health Programs Schema

  1. New Tables
    - `sleep_programs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `wake_time` (time)
      - `sleep_time` (time)
      - `duration` (interval)
      - `created_at` (timestamp)
      - `active` (boolean)

    - `nutrition_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `body_type` (text)
      - `goal` (text)
      - `calories` (integer)
      - `created_at` (timestamp)
      - `active` (boolean)

    - `appointments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `doctor_id` (uuid)
      - `appointment_date` (timestamp)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Sleep Programs
CREATE TABLE sleep_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  wake_time time NOT NULL,
  sleep_time time NOT NULL,
  duration interval NOT NULL,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  alarm_enabled boolean DEFAULT true
);

ALTER TABLE sleep_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sleep programs"
  ON sleep_programs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Nutrition Plans
CREATE TABLE nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  body_type text NOT NULL,
  goal text NOT NULL,
  calories integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  dietary_restrictions text[]
);

ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own nutrition plans"
  ON nutrition_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Appointments
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  doctor_id uuid NOT NULL,
  appointment_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  email_sent boolean DEFAULT false,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);