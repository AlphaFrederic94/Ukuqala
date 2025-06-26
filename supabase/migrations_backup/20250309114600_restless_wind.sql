/*
  # Create app_pins table

  1. New Tables
    - `app_pins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `pin_hash` (text)
      - `created_at` (timestamp)
      - `last_used` (timestamp)
  2. Security
    - Enable RLS on `app_pins` table
    - Add policy for users to manage their own PINs
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS app_pins;

-- Create app_pins table with proper constraints
CREATE TABLE app_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  pin_hash text NOT NULL,
  attempts integer DEFAULT 0,
  last_attempt timestamptz,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now()
);

-- Add unique constraint on user_id to ensure one PIN per user
ALTER TABLE app_pins ADD CONSTRAINT unique_user_pin UNIQUE (user_id);

-- Add check constraint for attempts
ALTER TABLE app_pins ADD CONSTRAINT check_attempts CHECK (attempts >= 0 AND attempts <= 3);

-- Enable RLS
ALTER TABLE app_pins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own PINs"
  ON app_pins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PINs"
  ON app_pins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PINs"
  ON app_pins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
