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

-- Users can view their own verification data
CREATE POLICY "Users can view their own verification data" 
  ON student_verification.verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification data if they don't have a pending or verified record
CREATE POLICY "Users can insert their own verification data" 
  ON student_verification.verifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM student_verification.verifications
      WHERE user_id = auth.uid() AND verification_status IN ('pending', 'verified')
    )
  );

-- Users can update their own verification data if it's rejected
CREATE POLICY "Users can update their own rejected verification data" 
  ON student_verification.verifications
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    verification_status = 'rejected'
  );

-- Create function to check if a user is a verified student
CREATE OR REPLACE FUNCTION student_verification.is_verified_student(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM student_verification.verifications
    WHERE user_id = p_user_id AND verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get verification status for a user
CREATE OR REPLACE FUNCTION student_verification.get_verification_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT verification_status INTO v_status
  FROM student_verification.verifications
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for student verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('student_verification_docs', 'student_verification_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for student_verification_docs
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'student_verification_docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'student_verification_docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own verification documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'student_verification_docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'student_verification_docs' AND auth.uid()::text = (storage.foldername(name))[1]);
