-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('health_records', 'health_records', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Add columns to tables
ALTER TABLE blockchain_health_records 
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Note: After running this migration, you need to manually create the following policies in the Supabase dashboard:

-- For health_records bucket:
-- 1. Policy name: "Users can upload their own health records"
--    Operation: INSERT
--    Policy definition: bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]

-- 2. Policy name: "Users can view their own health records"
--    Operation: SELECT
--    Policy definition: bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]

-- 3. Policy name: "Users can update their own health records"
--    Operation: UPDATE
--    Policy definition: bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]

-- 4. Policy name: "Users can delete their own health records"
--    Operation: DELETE
--    Policy definition: bucket_id = 'health_records' AND auth.uid()::text = (storage.foldername(name))[1]

-- For avatars bucket:
-- 1. Policy name: "Users can upload their own avatars"
--    Operation: INSERT
--    Policy definition: bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]

-- 2. Policy name: "Users can view all avatars"
--    Operation: SELECT
--    Policy definition: bucket_id = 'avatars'

-- 3. Policy name: "Users can update their own avatars"
--    Operation: UPDATE
--    Policy definition: bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]

-- 4. Policy name: "Users can delete their own avatars"
--    Operation: DELETE
--    Policy definition: bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
