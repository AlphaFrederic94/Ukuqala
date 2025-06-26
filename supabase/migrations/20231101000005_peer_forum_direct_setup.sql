-- Direct setup for peer forum tables
-- This script creates all necessary tables for the peer forum without relying on functions

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
  position INTEGER DEFAULT 0,
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

-- Create default server
INSERT INTO peer_forum.servers (id, name, description, icon, is_default)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Medical Students Hub', 'Welcome to the Medical Students Hub!', '🏥', true)
ON CONFLICT (id) DO NOTHING;

-- Create default channels
INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'welcome', 'Welcome to the channel! Get started with introductions.', 'text', '00000000-0000-0000-0000-000000000001', 'INFORMATION'),
  ('00000000-0000-0000-0000-000000000002', 'announcements', 'Important updates and announcements.', 'text', '00000000-0000-0000-0000-000000000001', 'INFORMATION'),
  ('00000000-0000-0000-0000-000000000003', 'general', 'General discussion for all medical students.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS'),
  ('00000000-0000-0000-0000-000000000004', 'study-tips', 'Share and discover effective study techniques.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS'),
  ('00000000-0000-0000-0000-000000000005', 'resources', 'Share helpful books, websites, and materials.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS'),
  ('00000000-0000-0000-0000-000000000006', 'case-discussions', 'Discuss interesting medical cases.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS')
ON CONFLICT (id) DO NOTHING;

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
