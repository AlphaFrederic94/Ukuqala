-- Create student_verifications table in the public schema
CREATE TABLE IF NOT EXISTS public.student_verifications (
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
CREATE INDEX IF NOT EXISTS idx_student_verifications_user_id ON public.student_verifications(user_id);

-- Create index on verification_status for filtering
CREATE INDEX IF NOT EXISTS idx_student_verifications_status ON public.student_verifications(verification_status);

-- Enable RLS for the student_verifications table
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Users can view their own verification data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_verifications' 
    AND schemaname = 'public' 
    AND policyname = 'Users can view their own verification data'
  ) THEN
    CREATE POLICY "Users can view their own verification data" 
      ON public.student_verifications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  -- Users can insert their own verification data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_verifications' 
    AND schemaname = 'public' 
    AND policyname = 'Users can insert their own verification data'
  ) THEN
    CREATE POLICY "Users can insert their own verification data" 
      ON public.student_verifications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Users can update their own verification data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_verifications' 
    AND schemaname = 'public' 
    AND policyname = 'Users can update their own verification data'
  ) THEN
    CREATE POLICY "Users can update their own verification data" 
      ON public.student_verifications
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Make sure the social bucket exists for document storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('social', 'social', true)
ON CONFLICT (id) DO NOTHING;

-- Create functions for verification status checks
CREATE OR REPLACE FUNCTION public.is_verified_student(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.student_verifications
    WHERE user_id = p_user_id AND verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_verification_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT verification_status INTO v_status
  FROM public.student_verifications
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
