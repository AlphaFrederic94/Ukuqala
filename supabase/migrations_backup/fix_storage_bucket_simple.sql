-- Fix Storage Bucket Settings

-- Check current bucket settings
SELECT * FROM storage.buckets WHERE name = 'social';

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE name = 'social';

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete" ON storage.objects;

-- Create basic policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'social');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'social');

CREATE POLICY "Owners can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'social' AND owner = auth.uid());

CREATE POLICY "Owners can delete" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'social' AND owner = auth.uid());

-- Verify the policies
SELECT policyname, tablename, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
