-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_latest_messages_sent(uuid);

-- Create a simpler version of the function that doesn't use DISTINCT ON
CREATE OR REPLACE FUNCTION public.get_latest_messages_sent(user_id_param UUID)
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
CREATE OR REPLACE FUNCTION public.get_messages_between_users(user1_id UUID, user2_id UUID)
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
