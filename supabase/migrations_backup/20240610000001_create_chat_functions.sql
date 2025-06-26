-- Function to get latest messages sent by a user
CREATE OR REPLACE FUNCTION get_latest_messages_sent(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    content TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    recipient_name TEXT,
    recipient_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT 
            cm.*,
            p.full_name AS recipient_name,
            p.avatar_url AS recipient_avatar,
            ROW_NUMBER() OVER (PARTITION BY cm.recipient_id ORDER BY cm.created_at DESC) AS rn
        FROM 
            chat_messages cm
        JOIN 
            profiles p ON cm.recipient_id = p.id
        WHERE 
            cm.sender_id = user_id_param
    )
    SELECT 
        rm.id,
        rm.sender_id,
        rm.recipient_id,
        rm.content,
        rm.is_read,
        rm.created_at,
        rm.recipient_name,
        rm.recipient_avatar
    FROM 
        ranked_messages rm
    WHERE 
        rm.rn = 1
    ORDER BY 
        rm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest messages received by a user
CREATE OR REPLACE FUNCTION get_latest_messages_received(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    content TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    sender_name TEXT,
    sender_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT 
            cm.*,
            p.full_name AS sender_name,
            p.avatar_url AS sender_avatar,
            ROW_NUMBER() OVER (PARTITION BY cm.sender_id ORDER BY cm.created_at DESC) AS rn
        FROM 
            chat_messages cm
        JOIN 
            profiles p ON cm.sender_id = p.id
        WHERE 
            cm.recipient_id = user_id_param
    )
    SELECT 
        rm.id,
        rm.sender_id,
        rm.recipient_id,
        rm.content,
        rm.is_read,
        rm.created_at,
        rm.sender_name,
        rm.sender_avatar
    FROM 
        ranked_messages rm
    WHERE 
        rm.rn = 1
    ORDER BY 
        rm.created_at DESC;
END;
$$ LANGUAGE plpgsql;
