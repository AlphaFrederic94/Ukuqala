-- Check existing storage buckets
SELECT id, name, public FROM storage.buckets;

-- Create or update the 'social' bucket
DO $$
BEGIN
  -- Check if the 'social' bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'social') THEN
    -- Make sure it's public
    UPDATE storage.buckets SET public = true WHERE name = 'social';
    RAISE NOTICE 'Updated social bucket to be public';
  ELSE
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social', 'social', true);
    RAISE NOTICE 'Created social bucket';
  END IF;

  -- Enable RLS on storage.objects
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Enabled RLS on storage.objects';

  -- Create storage policies for the social bucket
  -- Allow authenticated users to upload files
  BEGIN
    CREATE POLICY "Allow authenticated users to upload files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'social');
    RAISE NOTICE 'Created upload policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Upload policy already exists for social bucket';
  END;

  -- Allow public access to read files
  BEGIN
    CREATE POLICY "Allow public access to social files"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'social');
    RAISE NOTICE 'Created public read policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Public read policy already exists for social bucket';
  END;

  -- Allow users to update and delete their own files
  BEGIN
    CREATE POLICY "Allow users to update their own files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'social' AND owner = auth.uid());
    RAISE NOTICE 'Created update policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Update policy already exists for social bucket';
  END;

  BEGIN
    CREATE POLICY "Allow users to delete their own files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'social' AND owner = auth.uid());
    RAISE NOTICE 'Created delete policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Delete policy already exists for social bucket';
  END;
END
$$;
