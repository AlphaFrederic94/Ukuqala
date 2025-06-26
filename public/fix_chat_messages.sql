-- Create the get_chat_messages function that the app is trying to call
CREATE OR REPLACE FUNCTION public.get_chat_messages(
  user1_id UUID,
  user2_id UUID
)
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
  file_size INTEGER,
  sender_name TEXT,
  sender_avatar TEXT,
  recipient_name TEXT,
  recipient_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH message_data AS (
    SELECT
      cm.*
    FROM
      chat_messages cm
    WHERE
      (cm.sender_id = user1_id AND cm.recipient_id = user2_id) OR
      (cm.sender_id = user2_id AND cm.recipient_id = user1_id)
    ORDER BY
      cm.created_at ASC
  ),
  user_profiles AS (
    SELECT
      p.id,
      p.full_name,
      p.avatar_url
    FROM
      profiles p
    WHERE
      p.id = user1_id OR p.id = user2_id
  )
  SELECT
    md.id,
    md.sender_id,
    md.recipient_id,
    md.content,
    md.created_at,
    md.is_read,
    md.file_url,
    md.file_type,
    md.file_name,
    md.file_size,
    sender_profile.full_name AS sender_name,
    sender_profile.avatar_url AS sender_avatar,
    recipient_profile.full_name AS recipient_name,
    recipient_profile.avatar_url AS recipient_avatar
  FROM
    message_data md
  LEFT JOIN
    user_profiles sender_profile ON md.sender_id = sender_profile.id
  LEFT JOIN
    user_profiles recipient_profile ON md.recipient_id = recipient_profile.id
  ORDER BY
    md.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_user_id UUID,
  p_sender_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_messages
  SET is_read = TRUE
  WHERE 
    recipient_id = p_user_id AND 
    sender_id = p_sender_id AND
    is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM chat_messages
  WHERE recipient_id = p_user_id AND is_read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the latest messages for a user
CREATE OR REPLACE FUNCTION public.get_latest_messages(
  p_user_id UUID
)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT DISTINCT
      CASE
        WHEN cm.sender_id = p_user_id THEN cm.recipient_id
        ELSE cm.sender_id
      END AS other_id
    FROM
      chat_messages cm
    WHERE
      cm.sender_id = p_user_id OR cm.recipient_id = p_user_id
  ),
  latest_messages AS (
    SELECT
      c.other_id,
      (
        SELECT cm.content
        FROM chat_messages cm
        WHERE (cm.sender_id = p_user_id AND cm.recipient_id = c.other_id) OR
              (cm.sender_id = c.other_id AND cm.recipient_id = p_user_id)
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) AS last_message,
      (
        SELECT cm.created_at
        FROM chat_messages cm
        WHERE (cm.sender_id = p_user_id AND cm.recipient_id = c.other_id) OR
              (cm.sender_id = c.other_id AND cm.recipient_id = p_user_id)
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) AS last_time,
      (
        SELECT COUNT(*)
        FROM chat_messages cm
        WHERE cm.sender_id = c.other_id AND cm.recipient_id = p_user_id AND cm.is_read = FALSE
      ) AS unread
    FROM
      conversations c
  )
  SELECT
    gen_random_uuid() AS conversation_id,
    lm.other_id,
    p.full_name,
    p.avatar_url,
    lm.last_message,
    lm.last_time,
    lm.unread
  FROM
    latest_messages lm
  JOIN
    profiles p ON lm.other_id = p.id
  ORDER BY
    lm.last_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
