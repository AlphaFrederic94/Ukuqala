-- Chat System Tables for CareAI

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(policy_name text, table_name text) RETURNS boolean AS $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname = policy_name
  AND tablename = table_name;

  RETURN policy_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT policy_exists('Public profiles are viewable by everyone', 'profiles') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);
  END IF;

  IF NOT policy_exists('Users can update their own profile', 'profiles') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Create chat_messages table
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

-- Create RLS policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT policy_exists('Users can view messages they sent or received', 'chat_messages') THEN
    CREATE POLICY "Users can view messages they sent or received" ON public.chat_messages
      FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;

  IF NOT policy_exists('Users can insert messages they send', 'chat_messages') THEN
    CREATE POLICY "Users can insert messages they send" ON public.chat_messages
      FOR INSERT WITH CHECK (auth.uid() = sender_id);
  END IF;

  IF NOT policy_exists('Users can update messages they sent', 'chat_messages') THEN
    CREATE POLICY "Users can update messages they sent" ON public.chat_messages
      FOR UPDATE USING (auth.uid() = sender_id);
  END IF;
END $$;

-- Create chat_groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS public.chat_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create chat_group_messages table
CREATE TABLE IF NOT EXISTS public.chat_group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
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

-- Create RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT policy_exists('Users can view their own notifications', 'notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can update their own notifications', 'notifications') THEN
    CREATE POLICY "Users can update their own notifications" ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create user_friendships table
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

-- Create RLS policies for user_friendships
ALTER TABLE public.user_friendships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT policy_exists('Users can view their own friendships', 'user_friendships') THEN
    CREATE POLICY "Users can view their own friendships" ON public.user_friendships
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;

  IF NOT policy_exists('Users can insert their own friendship requests', 'user_friendships') THEN
    CREATE POLICY "Users can insert their own friendship requests" ON public.user_friendships
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can update friendships they are part of', 'user_friendships') THEN
    CREATE POLICY "Users can update friendships they are part of" ON public.user_friendships
      FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_latest_messages_sent(uuid);

-- Create function for chat functionality
CREATE FUNCTION public.get_latest_messages_sent(user_id_param UUID)
RETURNS TABLE (
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (
      CASE
        WHEN sender_id = user_id_param THEN recipient_id
        ELSE sender_id
      END
    )
    id,
    sender_id,
    recipient_id,
    content,
    created_at,
    is_read
    FROM chat_messages
    WHERE sender_id = user_id_param OR recipient_id = user_id_param
    ORDER BY
      CASE
        WHEN sender_id = user_id_param THEN recipient_id
        ELSE sender_id
      END,
      created_at DESC
  )
  SELECT
    sender_id,
    recipient_id,
    content,
    created_at,
    is_read
  FROM latest_messages
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
