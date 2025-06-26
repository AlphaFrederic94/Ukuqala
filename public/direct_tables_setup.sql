-- Direct Tables Setup Script
-- This script directly creates all necessary tables without relying on functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat_messages
CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS chat_messages_recipient_id_idx ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Create user_friendships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create indexes for user_friendships
CREATE INDEX IF NOT EXISTS user_friendships_user_id_idx ON public.user_friendships(user_id);
CREATE INDEX IF NOT EXISTS user_friendships_friend_id_idx ON public.user_friendships(friend_id);

-- Create hashtags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for hashtags
CREATE INDEX IF NOT EXISTS hashtags_name_idx ON public.hashtags(name);

-- Create saved_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create indexes for saved_posts
CREATE INDEX IF NOT EXISTS saved_posts_user_id_idx ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS saved_posts_post_id_idx ON public.saved_posts(post_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public profiles are viewable by everyone' 
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update their own profile' 
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Create RLS policies for chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view messages they sent or received' 
    AND tablename = 'chat_messages'
  ) THEN
    CREATE POLICY "Users can view messages they sent or received" ON public.chat_messages
      FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can insert messages they send' 
    AND tablename = 'chat_messages'
  ) THEN
    CREATE POLICY "Users can insert messages they send" ON public.chat_messages
      FOR INSERT WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update messages they sent' 
    AND tablename = 'chat_messages'
  ) THEN
    CREATE POLICY "Users can update messages they sent" ON public.chat_messages
      FOR UPDATE USING (auth.uid() = sender_id);
  END IF;
END $$;

-- Create RLS policies for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view their own notifications' 
    AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update their own notifications' 
    AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications" ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for user_friendships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view their own friendships' 
    AND tablename = 'user_friendships'
  ) THEN
    CREATE POLICY "Users can view their own friendships" ON public.user_friendships
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can insert their own friendship requests' 
    AND tablename = 'user_friendships'
  ) THEN
    CREATE POLICY "Users can insert their own friendship requests" ON public.user_friendships
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update friendships they are part of' 
    AND tablename = 'user_friendships'
  ) THEN
    CREATE POLICY "Users can update friendships they are part of" ON public.user_friendships
      FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS public.get_latest_messages_sent(uuid);
DROP FUNCTION IF EXISTS public.get_messages_between_users(uuid, uuid);

-- Create a simpler version of the get_latest_messages_sent function
CREATE FUNCTION public.get_latest_messages_sent(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.sender_id,
    cm.recipient_id,
    cm.content,
    cm.created_at,
    cm.is_read
  FROM chat_messages cm
  WHERE cm.sender_id = user_id_param OR cm.recipient_id = user_id_param
  ORDER BY cm.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get messages between two users
CREATE FUNCTION public.get_messages_between_users(user1_id UUID, user2_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.sender_id,
    cm.recipient_id,
    cm.content,
    cm.created_at,
    cm.is_read
  FROM chat_messages cm
  WHERE (cm.sender_id = user1_id AND cm.recipient_id = user2_id) OR
        (cm.sender_id = user2_id AND cm.recipient_id = user1_id)
  ORDER BY cm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
