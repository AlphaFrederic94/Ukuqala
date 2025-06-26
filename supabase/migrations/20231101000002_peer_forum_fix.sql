-- Fix for peer forum tables
-- This script ensures all necessary tables exist and adds channel membership tracking

-- Create peer_forum schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS peer_forum;

-- Create servers table if it doesn't exist
CREATE TABLE IF NOT EXISTS peer_forum.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS peer_forum.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  server_id UUID NOT NULL REFERENCES peer_forum.servers(id) ON DELETE CASCADE,
  category TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS peer_forum.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES peer_forum.channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES peer_forum.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS peer_forum.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES peer_forum.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'file', 'audio', 'video', 'poll')),
  url TEXT,
  name TEXT,
  size BIGINT,
  duration INTEGER, -- For audio/video in seconds
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create server_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS peer_forum.server_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES peer_forum.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (server_id, user_id)
);

-- Create channel_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS peer_forum.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES peer_forum.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

-- Create function to join a channel
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
END;
$$ LANGUAGE plpgsql;

-- Create function to check if a user is a member of a channel
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

-- Create function to get channel members
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
  JOIN 
    auth.users u ON cm.user_id = u.id
  WHERE 
    cm.channel_id = p_channel_id
  ORDER BY 
    cm.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE peer_forum.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.channel_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public servers are viewable by everyone" ON peer_forum.servers;
DROP POLICY IF EXISTS "Authenticated users can create servers" ON peer_forum.servers;
DROP POLICY IF EXISTS "Server owners can update their servers" ON peer_forum.servers;
DROP POLICY IF EXISTS "Server owners can delete their servers" ON peer_forum.servers;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON peer_forum.channels;
DROP POLICY IF EXISTS "Server members can create channels" ON peer_forum.channels;
DROP POLICY IF EXISTS "Anyone can view messages in public channels" ON peer_forum.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON peer_forum.messages;

-- Create RLS policies for peer forum tables
-- Servers policies
CREATE POLICY "Public servers are viewable by everyone" ON peer_forum.servers
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create servers" ON peer_forum.servers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Channels policies
CREATE POLICY "Public channels are viewable by everyone" ON peer_forum.channels
FOR SELECT USING (
  NOT is_private OR
  EXISTS (
    SELECT 1 FROM peer_forum.channel_members
    WHERE channel_id = peer_forum.channels.id
    AND user_id = auth.uid()
  )
);

-- Messages policies
CREATE POLICY "Channel members can view messages" ON peer_forum.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM peer_forum.channels
    WHERE id = peer_forum.messages.channel_id
    AND NOT is_private
  ) OR
  EXISTS (
    SELECT 1 FROM peer_forum.channel_members
    WHERE channel_id = peer_forum.messages.channel_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Channel members can create messages" ON peer_forum.messages
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM peer_forum.channel_members
    WHERE channel_id = peer_forum.messages.channel_id
    AND user_id = auth.uid()
  )
);

-- Channel members policies
CREATE POLICY "Users can view channel members" ON peer_forum.channel_members
FOR SELECT USING (true);

CREATE POLICY "Users can join channels" ON peer_forum.channel_members
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  user_id = auth.uid()
);

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('peer_forum_files', 'peer_forum_files')
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DROP POLICY IF EXISTS "Public Access to peer_forum_files" ON storage.objects;
CREATE POLICY "Public Access to peer_forum_files" ON storage.objects
FOR SELECT USING (bucket_id = 'peer_forum_files');

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'peer_forum_files' AND
  auth.role() = 'authenticated'
);
