-- This script adds the missing foreign key relationships to the chat_messages table

-- First, let's check if the chat_messages table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    -- Create the chat_messages table if it doesn't exist
    CREATE TABLE public.chat_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_read BOOLEAN DEFAULT FALSE,
      file_url TEXT,
      file_type TEXT,
      file_name TEXT,
      file_size BIGINT
    );
  ELSE
    -- If the table exists but doesn't have the foreign key constraints, add them
    
    -- First, check if the sender_id foreign key exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'chat_messages_sender_id_fkey' 
      AND conrelid = 'public.chat_messages'::regclass
    ) THEN
      -- Add the sender_id foreign key
      ALTER TABLE public.chat_messages 
      ADD CONSTRAINT chat_messages_sender_id_fkey 
      FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if the recipient_id foreign key exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'chat_messages_recipient_id_fkey' 
      AND conrelid = 'public.chat_messages'::regclass
    ) THEN
      -- Add the recipient_id foreign key
      ALTER TABLE public.chat_messages 
      ADD CONSTRAINT chat_messages_recipient_id_fkey 
      FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON public.chat_messages(is_read);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy to allow users to see messages they've sent or received
DROP POLICY IF EXISTS chat_messages_select_policy ON public.chat_messages;
CREATE POLICY chat_messages_select_policy ON public.chat_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy to allow users to insert messages they're sending
DROP POLICY IF EXISTS chat_messages_insert_policy ON public.chat_messages;
CREATE POLICY chat_messages_insert_policy ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to update messages they've received (for marking as read)
DROP POLICY IF EXISTS chat_messages_update_policy ON public.chat_messages;
CREATE POLICY chat_messages_update_policy ON public.chat_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Policy to allow users to delete messages they've sent
DROP POLICY IF EXISTS chat_messages_delete_policy ON public.chat_messages;
CREATE POLICY chat_messages_delete_policy ON public.chat_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Create a view to make it easier to query messages with user information
CREATE OR REPLACE VIEW public.chat_messages_with_users AS
SELECT 
  cm.id,
  cm.sender_id,
  cm.recipient_id,
  cm.content,
  cm.created_at,
  cm.is_read,
  cm.file_url,
  cm.file_type,
  cm.file_name,
  cm.file_size,
  sender.full_name AS sender_name,
  sender.avatar_url AS sender_avatar,
  recipient.full_name AS recipient_name,
  recipient.avatar_url AS recipient_avatar
FROM 
  public.chat_messages cm
JOIN 
  public.profiles sender ON cm.sender_id = sender.id
JOIN 
  public.profiles recipient ON cm.recipient_id = recipient.id;

-- Create RLS policy for the view
ALTER VIEW public.chat_messages_with_users SECURITY INVOKER;

-- Create a function to get messages between two users
CREATE OR REPLACE FUNCTION public.get_chat_messages(user1_id UUID, user2_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  file_size BIGINT,
  sender_name TEXT,
  sender_avatar TEXT,
  recipient_name TEXT,
  recipient_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.chat_messages_with_users
  WHERE (sender_id = user1_id AND recipient_id = user2_id) OR
        (sender_id = user2_id AND recipient_id = user1_id)
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get recent conversations for a user
CREATE OR REPLACE FUNCTION public.get_recent_conversations(user_id UUID)
RETURNS TABLE (
  conversation_user_id UUID,
  conversation_user_name TEXT,
  conversation_user_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (
      CASE WHEN sender_id = user_id THEN recipient_id ELSE sender_id END
    )
      CASE WHEN sender_id = user_id THEN recipient_id ELSE sender_id END AS other_user_id,
      content,
      created_at,
      sender_id,
      is_read,
      file_url,
      file_type
    FROM
      public.chat_messages
    WHERE
      sender_id = user_id OR recipient_id = user_id
    ORDER BY
      CASE WHEN sender_id = user_id THEN recipient_id ELSE sender_id END,
      created_at DESC
  ),
  unread_counts AS (
    SELECT
      sender_id AS other_user_id,
      COUNT(*) AS count
    FROM
      public.chat_messages
    WHERE
      recipient_id = user_id AND is_read = FALSE
    GROUP BY
      sender_id
  )
  SELECT
    lm.other_user_id,
    p.full_name,
    p.avatar_url,
    CASE
      WHEN lm.file_url IS NOT NULL AND lm.file_type LIKE 'image/%' THEN 'Sent an image'
      WHEN lm.file_url IS NOT NULL AND lm.file_type LIKE 'audio/%' THEN 'Sent an audio message'
      WHEN lm.file_url IS NOT NULL AND lm.file_type LIKE 'video/%' THEN 'Sent a video'
      WHEN lm.file_url IS NOT NULL THEN 'Sent a file'
      ELSE lm.content
    END,
    lm.created_at,
    COALESCE(uc.count, 0)
  FROM
    latest_messages lm
  JOIN
    public.profiles p ON lm.other_user_id = p.id
  LEFT JOIN
    unread_counts uc ON lm.other_user_id = uc.other_user_id
  ORDER BY
    lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
