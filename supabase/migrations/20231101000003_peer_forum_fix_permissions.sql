-- Fix permissions for peer forum tables
-- This script ensures all necessary permissions are set correctly

-- Make sure the peer_forum schema exists
CREATE SCHEMA IF NOT EXISTS peer_forum;

-- Ensure tables have the correct permissions
ALTER TABLE IF EXISTS peer_forum.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.channel_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public servers are viewable by everyone" ON peer_forum.servers;
DROP POLICY IF EXISTS "Authenticated users can create servers" ON peer_forum.servers;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON peer_forum.channels;
DROP POLICY IF EXISTS "Channel members can view messages" ON peer_forum.messages;
DROP POLICY IF EXISTS "Channel members can create messages" ON peer_forum.messages;
DROP POLICY IF EXISTS "Users can view channel members" ON peer_forum.channel_members;
DROP POLICY IF EXISTS "Users can join channels" ON peer_forum.channel_members;

-- Create more permissive policies for development
-- In production, you would want more restrictive policies

-- Servers policies
CREATE POLICY "Anyone can view servers" ON peer_forum.servers
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create servers" ON peer_forum.servers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update servers" ON peer_forum.servers
FOR UPDATE USING (auth.role() = 'authenticated');

-- Channels policies
CREATE POLICY "Anyone can view channels" ON peer_forum.channels
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create channels" ON peer_forum.channels
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update channels" ON peer_forum.channels
FOR UPDATE USING (auth.role() = 'authenticated');

-- Messages policies
CREATE POLICY "Anyone can view messages" ON peer_forum.messages
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create messages" ON peer_forum.messages
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Message owners can update messages" ON peer_forum.messages
FOR UPDATE USING (auth.uid() = user_id);

-- Channel members policies
CREATE POLICY "Anyone can view channel members" ON peer_forum.channel_members
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join channels" ON peer_forum.channel_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can update their membership" ON peer_forum.channel_members
FOR UPDATE USING (auth.uid() = user_id);

-- Server members policies
CREATE POLICY "Anyone can view server members" ON peer_forum.server_members
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join servers" ON peer_forum.server_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can update their server membership" ON peer_forum.server_members
FOR UPDATE USING (auth.uid() = user_id);

-- Attachments policies
CREATE POLICY "Anyone can view attachments" ON peer_forum.attachments
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create attachments" ON peer_forum.attachments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Make sure the join_channel function exists and works correctly
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
