-- Create student_verification schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS student_verification;

-- Create student_verification table
CREATE TABLE IF NOT EXISTS student_verification.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_country TEXT NOT NULL,
  graduation_date DATE NOT NULL,
  school_email TEXT NOT NULL,
  school_website TEXT NOT NULL,
  document_urls TEXT[] NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by TEXT
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_verification_user_id ON student_verification.verifications(user_id);

-- Create index on verification_status for filtering
CREATE INDEX IF NOT EXISTS idx_student_verification_status ON student_verification.verifications(verification_status);

-- Create RLS policies for student_verification.verifications
ALTER TABLE student_verification.verifications ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Users can view their own verification data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verifications'
    AND schemaname = 'student_verification'
    AND policyname = 'Users can view their own verification data'
  ) THEN
    CREATE POLICY "Users can view their own verification data"
      ON student_verification.verifications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own verification data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verifications'
    AND schemaname = 'student_verification'
    AND policyname = 'Users can insert their own verification data'
  ) THEN
    CREATE POLICY "Users can insert their own verification data"
      ON student_verification.verifications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own verification data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verifications'
    AND schemaname = 'student_verification'
    AND policyname = 'Users can update their own verification data'
  ) THEN
    CREATE POLICY "Users can update their own verification data"
      ON student_verification.verifications
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Expose the schema to the API
COMMENT ON SCHEMA student_verification IS 'Schema for student verification data';

-- Grant usage on the schema to authenticated users
GRANT USAGE ON SCHEMA student_verification TO authenticated;

-- Grant select, insert, update on the verifications table to authenticated users
GRANT SELECT, INSERT, UPDATE ON student_verification.verifications TO authenticated;

-- Make sure the social bucket exists for document storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('social', 'social', true)
ON CONFLICT (id) DO NOTHING;

-- Drop the execute_sql function if it exists
DROP FUNCTION IF EXISTS public.execute_sql(text);

-- Create the function with the correct return type
CREATE FUNCTION public.execute_sql(sql text)
RETURNS SETOF json AS $func$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
