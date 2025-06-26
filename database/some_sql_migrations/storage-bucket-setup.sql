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

-- Make sure the social bucket exists (used as fallback in the code)
INSERT INTO storage.buckets (id, name, public)
VALUES ('social', 'social', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for social bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload to social bucket'
  ) THEN
    CREATE POLICY "Users can upload to social bucket"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'social');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Everyone can view social bucket'
  ) THEN
    CREATE POLICY "Everyone can view social bucket"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'social');
  END IF;
END $$;
