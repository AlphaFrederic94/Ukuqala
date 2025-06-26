-- This script fixes all the issues with storage permissions, notifications, and friend requests
-- Run this in the Supabase SQL editor

-- 1. Fix storage permissions
-- Enable Row Level Security on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a simple permissive policy for all buckets
DROP POLICY IF EXISTS "Allow authenticated users full access" ON storage.objects;
CREATE POLICY "Allow authenticated users full access" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create a policy for public read access
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" 
ON storage.objects 
FOR SELECT 
TO public 
USING (true);

-- 2. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own notifications
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to update only their own notifications
DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
CREATE POLICY notifications_update_policy ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete only their own notifications
DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;
CREATE POLICY notifications_delete_policy ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Policy to allow users to insert notifications for themselves
DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
CREATE POLICY notifications_insert_policy ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create the function that the app is trying to call
CREATE OR REPLACE FUNCTION public.create_notifications_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- The table is already created above, so this function just needs to exist
  RAISE NOTICE 'Notifications table already exists';
END;
$$ LANGUAGE plpgsql;

-- 3. Create user_friendships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_friendships_user_id ON public.user_friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friendships_friend_id ON public.user_friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friendships_status ON public.user_friendships(status);

-- Add RLS policies
ALTER TABLE public.user_friendships ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own friendships
DROP POLICY IF EXISTS user_friendships_select_policy ON public.user_friendships;
CREATE POLICY user_friendships_select_policy ON public.user_friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy to allow users to create friendship requests
DROP POLICY IF EXISTS user_friendships_insert_policy ON public.user_friendships;
CREATE POLICY user_friendships_insert_policy ON public.user_friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update friendship status
DROP POLICY IF EXISTS user_friendships_update_policy ON public.user_friendships;
CREATE POLICY user_friendships_update_policy ON public.user_friendships
  FOR UPDATE USING (auth.uid() = friend_id);

-- Create function to get pending friend requests
CREATE OR REPLACE FUNCTION public.get_pending_friend_requests()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.user_id,
    p.full_name,
    p.avatar_url,
    f.created_at
  FROM
    public.user_friendships f
  JOIN
    public.profiles p ON f.user_id = p.id
  WHERE
    f.friend_id = auth.uid() AND f.status = 'pending'
  ORDER BY
    f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send a friend request
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_friend_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_friendship_id UUID;
BEGIN
  -- Check if a friendship already exists
  IF EXISTS (
    SELECT 1 FROM public.user_friendships
    WHERE (user_id = auth.uid() AND friend_id = p_friend_id)
       OR (user_id = p_friend_id AND friend_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Friendship already exists';
  END IF;
  
  -- Create the friendship
  INSERT INTO public.user_friendships (
    user_id,
    friend_id,
    status
  ) VALUES (
    auth.uid(),
    p_friend_id,
    'pending'
  ) RETURNING id INTO v_friendship_id;
  
  -- Create a notification for the friend
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link
  ) VALUES (
    p_friend_id,
    'friend_request',
    'New Friend Request',
    (SELECT full_name FROM public.profiles WHERE id = auth.uid()) || ' sent you a friend request',
    '/social/friends'
  );
  
  RETURN v_friendship_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to accept a friend request
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_friendship_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from the friendship
  SELECT user_id INTO v_user_id
  FROM public.user_friendships
  WHERE id = p_friendship_id AND friend_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or not pending';
  END IF;
  
  -- Update the friendship status
  UPDATE public.user_friendships
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_friendship_id;
  
  -- Create a notification for the user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link
  ) VALUES (
    v_user_id,
    'friend_request_accepted',
    'Friend Request Accepted',
    (SELECT full_name FROM public.profiles WHERE id = auth.uid()) || ' accepted your friend request',
    '/social/friends'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject a friend request
CREATE OR REPLACE FUNCTION public.reject_friend_request(
  p_friendship_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the friendship status
  UPDATE public.user_friendships
  SET status = 'rejected', updated_at = NOW()
  WHERE id = p_friendship_id AND friend_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or not pending';
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the function that the app is trying to call for user_friendships
CREATE OR REPLACE FUNCTION public.create_user_friendships_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- The table is already created above, so this function just needs to exist
  RAISE NOTICE 'User friendships table already exists';
END;
$$ LANGUAGE plpgsql;

-- 5. Create the function that the app is trying to call for storage policies
CREATE OR REPLACE FUNCTION public.create_storage_policies_if_not_exist()
RETURNS VOID AS $$
BEGIN
  -- The policies are already created above, so this function just needs to exist
  RAISE NOTICE 'Storage policies already exist';
END;
$$ LANGUAGE plpgsql;

-- 6. Create the run_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.run_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
