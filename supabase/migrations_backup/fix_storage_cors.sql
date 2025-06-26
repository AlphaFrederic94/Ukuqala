-- Fix Storage CORS Settings

-- Check current bucket settings
SELECT * FROM storage.buckets WHERE name = 'social';

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE name = 'social';

-- Set CORS configuration using the proper API
-- This is done through the Supabase dashboard:
-- 1. Go to Storage > Buckets
-- 2. Click on the 'social' bucket
-- 3. Go to the 'Settings' tab
-- 4. Under 'CORS', add the following configuration:
--    - Origin: *
--    - Methods: GET, POST, PUT, DELETE, OPTIONS
--    - Headers: *
--    - Max Age: 86400

-- Verify the bucket is public
SELECT name, public FROM storage.buckets WHERE name = 'social';

-- Check if RLS is enabled on storage.objects
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- List existing policies
SELECT policyname, tablename, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
