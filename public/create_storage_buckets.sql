-- This script creates the necessary storage buckets and sets up permissions

-- Create the media bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'media'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('media', 'media', true);
    
    RAISE NOTICE 'Created media bucket';
  ELSE
    RAISE NOTICE 'Media bucket already exists';
  END IF;
END $$;

-- Create the chat bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'chat'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chat', 'chat', true);
    
    RAISE NOTICE 'Created chat bucket';
  ELSE
    RAISE NOTICE 'Chat bucket already exists';
  END IF;
END $$;

-- Create the avatars bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    
    RAISE NOTICE 'Created avatars bucket';
  ELSE
    RAISE NOTICE 'Avatars bucket already exists';
  END IF;
END $$;

-- Set up policies for the media bucket
-- Policy to allow users to upload their own files
DROP POLICY IF EXISTS "Allow users to upload their own files" ON storage.objects;
CREATE POLICY "Allow users to upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('media', 'chat', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to update their own files
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('media', 'chat', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to delete their own files
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('media', 'chat', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to read files from any bucket
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('media', 'chat', 'avatars'));

-- Create a function to get a presigned URL for a file
CREATE OR REPLACE FUNCTION storage.get_presigned_url(
  bucket_name TEXT,
  object_name TEXT,
  expiry INTEGER DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  url TEXT;
BEGIN
  -- Generate a presigned URL
  SELECT storage.sign_url(bucket_name, object_name, expiry) INTO url;
  RETURN url;
END;
$$;
