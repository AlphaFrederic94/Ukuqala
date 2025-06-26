-- Drop existing buckets if they exist
DROP POLICY IF EXISTS "Users can upload their own health records" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own health records" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own health records" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own health records" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Delete existing buckets
DELETE FROM storage.buckets WHERE id = 'health_records';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('health_records', 'health_records', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Add columns to tables
ALTER TABLE blockchain_health_records 
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create policies for health_records bucket
CREATE POLICY "Users can upload their own health records"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own health records"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own health records"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own health records"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for avatars bucket
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
