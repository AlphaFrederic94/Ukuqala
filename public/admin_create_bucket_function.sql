-- Create a function that can be called by any authenticated user to create a bucket
-- This is a workaround for the permission issues with direct bucket creation

CREATE OR REPLACE FUNCTION public.admin_create_bucket(
  name TEXT,
  public BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the bucket already exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = admin_create_bucket.name) THEN
    RAISE NOTICE 'Bucket % already exists', admin_create_bucket.name;
    RETURN TRUE;
  END IF;
  
  -- Create the bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES (admin_create_bucket.name, admin_create_bucket.name, admin_create_bucket.public);
  
  -- Create RLS policies for the bucket
  
  -- Policy to allow users to upload their own files
  EXECUTE format('
    CREATE POLICY "Allow users to upload their own files to %s"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = %L AND
      (storage.foldername(name))[1] = auth.uid()::text
    )', admin_create_bucket.name, admin_create_bucket.name);
  
  -- Policy to allow users to update their own files
  EXECUTE format('
    CREATE POLICY "Allow users to update their own files in %s"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = %L AND
      (storage.foldername(name))[1] = auth.uid()::text
    )', admin_create_bucket.name, admin_create_bucket.name);
  
  -- Policy to allow users to delete their own files
  EXECUTE format('
    CREATE POLICY "Allow users to delete their own files from %s"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = %L AND
      (storage.foldername(name))[1] = auth.uid()::text
    )', admin_create_bucket.name, admin_create_bucket.name);
  
  -- Policy to allow users to read files
  IF admin_create_bucket.public THEN
    -- If public access is enabled, allow anyone to read
    EXECUTE format('
      CREATE POLICY "Allow public read access to %s"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = %L)', admin_create_bucket.name, admin_create_bucket.name);
  ELSE
    -- If public access is disabled, only allow authenticated users to read
    EXECUTE format('
      CREATE POLICY "Allow authenticated read access to %s"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = %L)', admin_create_bucket.name, admin_create_bucket.name);
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating bucket: %', SQLERRM;
    RETURN FALSE;
END;
$$;
