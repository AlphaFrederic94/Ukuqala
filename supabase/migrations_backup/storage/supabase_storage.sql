-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('health_records', 'health_records', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for health_records
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

-- Create storage policies for avatars
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
