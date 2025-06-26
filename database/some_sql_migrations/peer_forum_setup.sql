-- Peer Forum Setup Script
-- Run this script in the Supabase SQL Editor to set up the peer forum

-- Create peer_forum schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS peer_forum;

-- Create servers table
CREATE TABLE IF NOT EXISTS peer_forum.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Create channels table
CREATE TABLE IF NOT EXISTS peer_forum.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  server_id UUID NOT NULL REFERENCES peer_forum.servers(id) ON DELETE CASCADE,
  category TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Create messages table
CREATE TABLE IF NOT EXISTS peer_forum.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES peer_forum.channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES peer_forum.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create server_members table
CREATE TABLE IF NOT EXISTS peer_forum.server_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES peer_forum.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (server_id, user_id)
);

-- Create channel_members table
CREATE TABLE IF NOT EXISTS peer_forum.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES peer_forum.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS peer_forum.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES peer_forum.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT,
  name TEXT,
  size BIGINT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create join_channel function
CREATE OR REPLACE FUNCTION peer_forum.join_channel(
  p_channel_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_server_id UUID;
BEGIN
  -- Get the server_id for this channel
  SELECT server_id INTO v_server_id
  FROM peer_forum.channels
  WHERE id = p_channel_id;

  -- If channel doesn't exist, return false
  IF v_server_id IS NULL THEN
    RETURN false;
  END IF;

  -- Add user to server_members if not already a member
  INSERT INTO peer_forum.server_members (server_id, user_id, role)
  VALUES (v_server_id, p_user_id, 'member')
  ON CONFLICT (server_id, user_id) DO NOTHING;

  -- Add user to channel_members
  INSERT INTO peer_forum.channel_members (channel_id, user_id)
  VALUES (p_channel_id, p_user_id)
  ON CONFLICT (channel_id, user_id) DO UPDATE
  SET last_read_at = now();

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in join_channel: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create is_channel_member function
CREATE OR REPLACE FUNCTION peer_forum.is_channel_member(
  p_channel_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM peer_forum.channel_members
    WHERE channel_id = p_channel_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create get_channel_members function
CREATE OR REPLACE FUNCTION peer_forum.get_channel_members(
  p_channel_id UUID
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.user_id,
    u.raw_user_meta_data->>'full_name' as username,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    cm.joined_at,
    cm.last_read_at
  FROM
    peer_forum.channel_members cm
  LEFT JOIN
    auth.users u ON cm.user_id = u.id
  WHERE
    cm.channel_id = p_channel_id
  ORDER BY
    cm.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Create execute_sql function for admin use
-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS execute_sql(text);

-- Then create the new function with the same parameter name as the original
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION peer_forum.join_channel TO authenticated;
GRANT EXECUTE ON FUNCTION peer_forum.join_channel TO anon;
GRANT EXECUTE ON FUNCTION peer_forum.is_channel_member TO authenticated;
GRANT EXECUTE ON FUNCTION peer_forum.is_channel_member TO anon;
GRANT EXECUTE ON FUNCTION peer_forum.get_channel_members TO authenticated;
GRANT EXECUTE ON FUNCTION peer_forum.get_channel_members TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;

-- Note: Views will be created in separate statements
-- This is a comment to remind you to run the following statements separately in the SQL Editor:

/*
-- Create views in public schema for easier access
DROP VIEW IF EXISTS peer_forum_servers;
CREATE VIEW peer_forum_servers AS SELECT * FROM peer_forum.servers;

DROP VIEW IF EXISTS peer_forum_channels;
CREATE VIEW peer_forum_channels AS SELECT * FROM peer_forum.channels;

DROP VIEW IF EXISTS peer_forum_messages;
CREATE VIEW peer_forum_messages AS SELECT * FROM peer_forum.messages;

DROP VIEW IF EXISTS peer_forum_server_members;
CREATE VIEW peer_forum_server_members AS SELECT * FROM peer_forum.server_members;

DROP VIEW IF EXISTS peer_forum_channel_members;
CREATE VIEW peer_forum_channel_members AS SELECT * FROM peer_forum.channel_members;

DROP VIEW IF EXISTS peer_forum_attachments;
CREATE VIEW peer_forum_attachments AS SELECT * FROM peer_forum.attachments;
*/

-- Note: Grant permissions on views (run these after creating the views)
/*
GRANT SELECT ON peer_forum_servers TO authenticated, anon;
GRANT SELECT ON peer_forum_channels TO authenticated, anon;
GRANT SELECT ON peer_forum_messages TO authenticated, anon;
GRANT SELECT ON peer_forum_server_members TO authenticated, anon;
GRANT SELECT ON peer_forum_channel_members TO authenticated, anon;
GRANT SELECT ON peer_forum_attachments TO authenticated, anon;
*/

-- Create default server
-- Note: These are simple INSERT statements without the ON CONFLICT clause
-- If you get an error about duplicate keys, you can safely ignore it

-- Create default server (if it doesn't exist)
-- Run this statement separately
/*
INSERT INTO peer_forum.servers (id, name, description, icon, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', 'Medical Students Hub', 'Welcome to the Medical Students Hub!', '🏥', true);
*/

-- Create default channels (if they don't exist)
-- Run each of these statements separately
/*
INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000001', 'welcome', 'Welcome to the channel! Get started with introductions.', 'text', '00000000-0000-0000-0000-000000000001', 'INFORMATION');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000002', 'announcements', 'Important updates and announcements.', 'text', '00000000-0000-0000-0000-000000000001', 'INFORMATION');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000003', 'general', 'General discussion for all medical students.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000004', 'study-tips', 'Share and discover effective study techniques.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000005', 'resources', 'Share helpful books, websites, and materials.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000006', 'case-discussions', 'Discuss interesting medical cases.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');
*/
