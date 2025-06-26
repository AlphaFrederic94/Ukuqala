-- Fix Storage Policies

-- First, check if the social bucket exists
SELECT id, name, public FROM storage.buckets WHERE name = 'social';

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on storage.objects
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END
$$;

-- Create basic policies for all buckets
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

-- Check if the policies were created successfully
SELECT
  policyname,
  tablename,
  cmd,
  permissive,
  roles,
  qual
FROM
  pg_policies
WHERE
  tablename = 'objects'
  AND schemaname = 'storage';
