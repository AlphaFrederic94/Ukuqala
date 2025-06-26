-- Update chat_messages table to add file attachment columns

-- Add file_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE public.chat_messages ADD COLUMN file_url TEXT;
  END IF;
END $$;

-- Add file_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE public.chat_messages ADD COLUMN file_type TEXT;
  END IF;
END $$;

-- Add file_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.chat_messages ADD COLUMN file_name TEXT;
  END IF;
END $$;

-- Add file_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE public.chat_messages ADD COLUMN file_size BIGINT;
  END IF;
END $$;

-- Update the get_latest_messages_sent function to include file columns
DROP FUNCTION IF EXISTS public.get_latest_messages_sent(uuid);

CREATE FUNCTION public.get_latest_messages_sent(user_id_param UUID)
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
  file_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
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
    cm.file_size
  FROM chat_messages cm
  WHERE cm.sender_id = user_id_param OR cm.recipient_id = user_id_param
  ORDER BY cm.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_messages_between_users function to include file columns
DROP FUNCTION IF EXISTS public.get_messages_between_users(uuid, uuid);

CREATE FUNCTION public.get_messages_between_users(user1_id UUID, user2_id UUID)
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
  file_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
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
    cm.file_size
  FROM chat_messages cm
  WHERE (cm.sender_id = user1_id AND cm.recipient_id = user2_id) OR
        (cm.sender_id = user2_id AND cm.recipient_id = user1_id)
  ORDER BY cm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
