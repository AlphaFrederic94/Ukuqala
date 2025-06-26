-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create storage bucket for social images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('social', 'social', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the social bucket
CREATE POLICY "Allow public read access for social bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'social');

CREATE POLICY "Allow authenticated users to upload files to social bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'social');

CREATE POLICY "Allow users to update their own files in social bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'social');

CREATE POLICY "Allow users to delete their own files in social bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'social');
