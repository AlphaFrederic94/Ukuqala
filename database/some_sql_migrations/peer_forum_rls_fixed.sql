-- Peer Forum RLS Policies
-- Run this script in the Supabase SQL Editor to set up RLS policies for the peer forum

-- Enable RLS on all tables
ALTER TABLE peer_forum.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_forum.attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for servers table if they don't exist
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Anyone can view servers'
    ) THEN
        -- Create the policy if it doesn't exist
        EXECUTE 'CREATE POLICY "Anyone can view servers" ON peer_forum.servers FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Authenticated users can create servers'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can create servers" ON peer_forum.servers FOR INSERT TO authenticated WITH CHECK (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servers' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Server creators can update their servers'
    ) THEN
        EXECUTE 'CREATE POLICY "Server creators can update their servers" ON peer_forum.servers FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid())';
    END IF;
END
$$;

-- Create policies for channels table if they don't exist
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channels' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Anyone can view channels'
    ) THEN
        -- Create the policy if it doesn't exist
        EXECUTE 'CREATE POLICY "Anyone can view channels" ON peer_forum.channels FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channels' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Authenticated users can create channels'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can create channels" ON peer_forum.channels FOR INSERT TO authenticated WITH CHECK (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channels' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Channel creators can update their channels'
    ) THEN
        EXECUTE 'CREATE POLICY "Channel creators can update their channels" ON peer_forum.channels FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid())';
    END IF;
END
$$;

-- Create policies for messages table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Anyone can view messages'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view messages" ON peer_forum.messages FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Authenticated users can create messages'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can create messages" ON peer_forum.messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Message creators can update their messages'
    ) THEN
        EXECUTE 'CREATE POLICY "Message creators can update their messages" ON peer_forum.messages FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Message creators can delete their messages'
    ) THEN
        EXECUTE 'CREATE POLICY "Message creators can delete their messages" ON peer_forum.messages FOR DELETE TO authenticated USING (user_id = auth.uid())';
    END IF;
END
$$;

-- Create policies for server_members table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Anyone can view server members'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view server members" ON peer_forum.server_members FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Authenticated users can join servers'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can join servers" ON peer_forum.server_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Members can update their own membership'
    ) THEN
        EXECUTE 'CREATE POLICY "Members can update their own membership" ON peer_forum.server_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Members can leave servers'
    ) THEN
        EXECUTE 'CREATE POLICY "Members can leave servers" ON peer_forum.server_members FOR DELETE TO authenticated USING (user_id = auth.uid())';
    END IF;
END
$$;

-- Create policies for channel_members table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channel_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Anyone can view channel members'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view channel members" ON peer_forum.channel_members FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channel_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Authenticated users can join channels'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can join channels" ON peer_forum.channel_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channel_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Members can update their own membership'
    ) THEN
        EXECUTE 'CREATE POLICY "Members can update their own membership" ON peer_forum.channel_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channel_members' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Members can leave channels'
    ) THEN
        EXECUTE 'CREATE POLICY "Members can leave channels" ON peer_forum.channel_members FOR DELETE TO authenticated USING (user_id = auth.uid())';
    END IF;
END
$$;

-- Create policies for attachments table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attachments' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Anyone can view attachments'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can view attachments" ON peer_forum.attachments FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attachments' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Authenticated users can upload attachments'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can upload attachments" ON peer_forum.attachments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attachments' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Attachment owners can update their attachments'
    ) THEN
        EXECUTE 'CREATE POLICY "Attachment owners can update their attachments" ON peer_forum.attachments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attachments' 
        AND schemaname = 'peer_forum' 
        AND policyname = 'Attachment owners can delete their attachments'
    ) THEN
        EXECUTE 'CREATE POLICY "Attachment owners can delete their attachments" ON peer_forum.attachments FOR DELETE TO authenticated USING (user_id = auth.uid())';
    END IF;
END
$$;

-- Grant permissions to authenticated and anonymous users
GRANT USAGE ON SCHEMA peer_forum TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA peer_forum TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA peer_forum TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA peer_forum TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA peer_forum TO anon;
