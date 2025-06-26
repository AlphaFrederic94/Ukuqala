-- Create a function to create storage buckets
CREATE OR REPLACE FUNCTION storage.create_bucket(
  bucket_name TEXT,
  public_access BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the bucket already exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = bucket_name) THEN
    RAISE NOTICE 'Bucket % already exists', bucket_name;
    RETURN;
  END IF;
  
  -- Create the bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES (bucket_name, bucket_name, public_access);
  
  -- Create RLS policies for the bucket
  
  -- Policy to allow users to upload their own files
  EXECUTE format('
    CREATE POLICY "Allow users to upload their own files to %s"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = %L AND
      (storage.foldername(name))[1] = auth.uid()::text
    )', bucket_name, bucket_name);
  
  -- Policy to allow users to update their own files
  EXECUTE format('
    CREATE POLICY "Allow users to update their own files in %s"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = %L AND
      (storage.foldername(name))[1] = auth.uid()::text
    )', bucket_name, bucket_name);
  
  -- Policy to allow users to delete their own files
  EXECUTE format('
    CREATE POLICY "Allow users to delete their own files from %s"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = %L AND
      (storage.foldername(name))[1] = auth.uid()::text
    )', bucket_name, bucket_name);
  
  -- Policy to allow users to read files
  IF public_access THEN
    -- If public access is enabled, allow anyone to read
    EXECUTE format('
      CREATE POLICY "Allow public read access to %s"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = %L)', bucket_name, bucket_name);
  ELSE
    -- If public access is disabled, only allow authenticated users to read
    EXECUTE format('
      CREATE POLICY "Allow authenticated read access to %s"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = %L)', bucket_name, bucket_name);
  END IF;
  
  RAISE NOTICE 'Created bucket % with public access = %', bucket_name, public_access;
END;
$$;

-- Create an RPC function to create buckets from the client
CREATE OR REPLACE FUNCTION public.create_storage_bucket(
  bucket_name TEXT,
  public_access BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to create buckets
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Call the storage function
  PERFORM storage.create_bucket(bucket_name, public_access);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating bucket: %', SQLERRM;
    RETURN FALSE;
END;
$$;
