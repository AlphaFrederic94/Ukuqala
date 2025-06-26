-- Create schema for peer forum
CREATE SCHEMA IF NOT EXISTS peer_forum;

-- Enable RLS
ALTER TABLE IF EXISTS peer_forum.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS peer_forum.server_members ENABLE ROW LEVEL SECURITY;

-- Create servers table
CREATE TABLE IF NOT EXISTS peer_forum.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  banner_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create channels table
CREATE TABLE IF NOT EXISTS peer_forum.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES peer_forum.servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice', 'video')),
  category TEXT,
  position INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS peer_forum.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES peer_forum.channels(id) ON DELETE CASCADE,
  content TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES peer_forum.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS peer_forum.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES peer_forum.messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'file', 'audio', 'video', 'poll')),
  url TEXT,
  name TEXT,
  size INTEGER,
  duration INTEGER, -- For audio/video in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS peer_forum.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES peer_forum.messages(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (message_id, emoji, user_id)
);

-- Create polls table
CREATE TABLE IF NOT EXISTS peer_forum.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id UUID REFERENCES peer_forum.attachments(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS peer_forum.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES peer_forum.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS peer_forum.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id UUID REFERENCES peer_forum.poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (poll_option_id, user_id)
);

-- Create channel members table for private channels
CREATE TABLE IF NOT EXISTS peer_forum.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES peer_forum.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (channel_id, user_id)
);

-- Create server members table
CREATE TABLE IF NOT EXISTS peer_forum.server_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES peer_forum.servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (server_id, user_id)
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('peer_forum_files', 'peer_forum_files', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage
-- Note: These will fail silently if they already exist, which is fine
DROP POLICY IF EXISTS "Public Access to peer_forum_files" ON storage.objects;
CREATE POLICY "Public Access to peer_forum_files" ON storage.objects
FOR SELECT USING (bucket_id = 'peer_forum_files');

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'peer_forum_files' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'peer_forum_files' AND
  auth.uid() = owner
);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'peer_forum_files' AND
  auth.uid() = owner
);

-- Create RLS policies for peer forum tables
-- Servers policies
DROP POLICY IF EXISTS "Public servers are viewable by everyone" ON peer_forum.servers;
CREATE POLICY "Public servers are viewable by everyone" ON peer_forum.servers
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create servers" ON peer_forum.servers;
CREATE POLICY "Authenticated users can create servers" ON peer_forum.servers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Server owners can update their servers" ON peer_forum.servers;
CREATE POLICY "Server owners can update their servers" ON peer_forum.servers
FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM peer_forum.server_members
    WHERE server_id = peer_forum.servers.id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Server owners can delete their servers" ON peer_forum.servers;
CREATE POLICY "Server owners can delete their servers" ON peer_forum.servers
FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM peer_forum.server_members
    WHERE server_id = peer_forum.servers.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Channels policies
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON peer_forum.channels;
CREATE POLICY "Public channels are viewable by everyone" ON peer_forum.channels
FOR SELECT USING (
  NOT is_private OR
  EXISTS (
    SELECT 1 FROM peer_forum.channel_members
    WHERE channel_id = peer_forum.channels.id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Server members can create channels" ON peer_forum.channels;
CREATE POLICY "Server members can create channels" ON peer_forum.channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM peer_forum.server_members
    WHERE server_id = peer_forum.channels.server_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'moderator')
  )
);

-- Messages policies
DROP POLICY IF EXISTS "Anyone can view messages in public channels" ON peer_forum.messages;
CREATE POLICY "Anyone can view messages in public channels" ON peer_forum.messages
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

DROP POLICY IF EXISTS "Authenticated users can create messages" ON peer_forum.messages;
CREATE POLICY "Authenticated users can create messages" ON peer_forum.messages
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  (
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
  )
);

-- Create realtime publication for peer forum
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE peer_forum.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE peer_forum.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE peer_forum.poll_votes;

-- Create function to get messages with user info
CREATE OR REPLACE FUNCTION peer_forum.get_messages(
  p_channel_id UUID,
  limit_count INTEGER DEFAULT 50,
  before_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  channel_id UUID,
  content TEXT,
  is_pinned BOOLEAN,
  is_edited BOOLEAN,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  username TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.channel_id,
    m.content,
    m.is_pinned,
    m.is_edited,
    m.parent_id,
    m.created_at,
    m.updated_at,
    m.user_id,
    u.raw_user_meta_data->>'full_name' as username,
    u.raw_user_meta_data->>'avatar_url' as avatar_url
  FROM
    peer_forum.messages m
  JOIN
    auth.users u ON m.user_id = u.id
  WHERE
    m.channel_id = p_channel_id
    AND (before_timestamp IS NULL OR m.created_at < before_timestamp)
  ORDER BY
    m.created_at DESC
  LIMIT
    limit_count;
END;
$$ LANGUAGE plpgsql;
