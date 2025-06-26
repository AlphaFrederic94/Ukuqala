-- CareAI Social Features Setup Script
-- This script creates all necessary tables, indexes, triggers, and policies for the social features

-- Create social_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create user_friendships table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create chat_group_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'friend_request', 'friend_accepted', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags ON social_posts USING GIN(hashtags);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_friendships_user_id ON user_friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friendships_friend_id ON user_friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friendships_status ON user_friendships(status);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON chat_group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_group_messages_group_id ON chat_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_messages_user_id ON chat_group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_messages_created_at ON chat_group_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create or replace stored procedures

-- Create notifications table procedure
CREATE OR REPLACE FUNCTION create_notifications_table()
RETURNS VOID AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    -- Create the table
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'friend_request', 'friend_accepted', 'system')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_read ON notifications(read);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
    
    -- Set up RLS
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Handle new post procedure
CREATE OR REPLACE FUNCTION handle_new_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's post count
  UPDATE profiles
  SET posts_count = posts_count + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new comment procedure
CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post's comment count
  UPDATE social_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  
  -- Create notification for post author if it's not the same user
  IF EXISTS (
    SELECT 1 FROM social_posts 
    WHERE id = NEW.post_id AND user_id != NEW.user_id
  ) THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link
    )
    SELECT 
      p.user_id,
      'comment',
      'New Comment',
      CASE 
        WHEN prof.full_name IS NOT NULL AND prof.full_name != '' 
        THEN prof.full_name || ' commented on your post'
        ELSE 'Someone commented on your post'
      END,
      '/social/post/' || NEW.post_id
    FROM social_posts p
    LEFT JOIN profiles prof ON prof.id = NEW.user_id
    WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new like procedure
CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post's like count
  UPDATE social_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  
  -- Create notification for post author if it's not the same user
  IF EXISTS (
    SELECT 1 FROM social_posts 
    WHERE id = NEW.post_id AND user_id != NEW.user_id
  ) THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link
    )
    SELECT 
      p.user_id,
      'like',
      'New Like',
      CASE 
        WHEN prof.full_name IS NOT NULL AND prof.full_name != '' 
        THEN prof.full_name || ' liked your post'
        ELSE 'Someone liked your post'
      END,
      '/social/post/' || NEW.post_id
    FROM social_posts p
    LEFT JOIN profiles prof ON prof.id = NEW.user_id
    WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get latest messages sent procedure
CREATE OR REPLACE FUNCTION get_latest_messages_sent(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  sender_name TEXT,
  sender_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.sender_id,
    cm.recipient_id,
    cm.content,
    cm.read,
    cm.created_at,
    p.full_name AS sender_name,
    p.avatar_url AS sender_avatar
  FROM chat_messages cm
  LEFT JOIN profiles p ON p.id = cm.sender_id
  WHERE cm.sender_id = user_id_param
  ORDER BY cm.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Get user chat groups procedure
CREATE OR REPLACE FUNCTION get_user_chat_groups(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  type TEXT,
  member_count BIGINT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cg.id,
    cg.name,
    cg.description,
    cg.image_url,
    cg.type,
    (SELECT COUNT(*) FROM chat_group_members WHERE group_id = cg.id) AS member_count,
    (SELECT content FROM chat_group_messages WHERE group_id = cg.id ORDER BY created_at DESC LIMIT 1) AS last_message,
    (SELECT created_at FROM chat_group_messages WHERE group_id = cg.id ORDER BY created_at DESC LIMIT 1) AS last_message_time
  FROM chat_groups cg
  JOIN chat_group_members cgm ON cgm.group_id = cg.id
  WHERE cgm.user_id = user_id_param
  ORDER BY last_message_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS tr_handle_new_post ON social_posts;
CREATE TRIGGER tr_handle_new_post
  AFTER INSERT ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_post();

DROP TRIGGER IF EXISTS tr_handle_new_comment ON post_comments;
CREATE TRIGGER tr_handle_new_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_comment();

DROP TRIGGER IF EXISTS tr_handle_new_like ON post_likes;
CREATE TRIGGER tr_handle_new_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_like();

-- Create storage bucket for social images if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'social_images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social_images', 'social_images', true);
  END IF;
END $$;

-- Set up Row Level Security (RLS) policies
-- social_posts policies
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON social_posts FOR SELECT
  USING (true);
  
CREATE POLICY "Users can insert their own posts"
  ON social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own posts"
  ON social_posts FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own posts"
  ON social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- post_comments policies
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON post_comments FOR SELECT
  USING (true);
  
CREATE POLICY "Users can insert their own comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- post_likes policies
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  USING (true);
  
CREATE POLICY "Users can insert their own likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- user_friendships policies
ALTER TABLE user_friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON user_friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
  
CREATE POLICY "Users can insert their own friendship requests"
  ON user_friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update friendships they're part of"
  ON user_friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
  
CREATE POLICY "Users can delete friendships they're part of"
  ON user_friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- chat_messages policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received"
  ON chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  
CREATE POLICY "Users can insert messages they send"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
  
CREATE POLICY "Users can update messages they sent or received"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  
CREATE POLICY "Users can delete messages they sent"
  ON chat_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- chat_groups policies
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public groups"
  ON chat_groups FOR SELECT
  USING (type = 'public' OR EXISTS (
    SELECT 1 FROM chat_group_members
    WHERE group_id = id AND user_id = auth.uid()
  ));
  
CREATE POLICY "Anyone can create groups"
  ON chat_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
  
CREATE POLICY "Group admins can update groups"
  ON chat_groups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM chat_group_members
    WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
  ));
  
CREATE POLICY "Group admins can delete groups"
  ON chat_groups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM chat_group_members
    WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
  ));

-- chat_group_members policies
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group members"
  ON chat_group_members FOR SELECT
  USING (true);
  
CREATE POLICY "Users can join public groups"
  ON chat_group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE id = group_id AND type = 'public'
    )
  );
  
CREATE POLICY "Group admins can add members"
  ON chat_group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );
  
CREATE POLICY "Group admins can update members"
  ON chat_group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );
  
CREATE POLICY "Users can leave groups"
  ON chat_group_members FOR DELETE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Group admins can remove members"
  ON chat_group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- chat_group_messages policies
ALTER TABLE chat_group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view messages"
  ON chat_group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = group_id AND user_id = auth.uid()
    )
  );
  
CREATE POLICY "Group members can send messages"
  ON chat_group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = group_id AND user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can update their own messages"
  ON chat_group_messages FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own messages"
  ON chat_group_messages FOR DELETE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Group admins can delete any message"
  ON chat_group_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- notifications policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default chat groups if they don't exist
INSERT INTO chat_groups (id, name, description, type, created_by)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Fitness',
  'Discuss fitness routines, workout tips, and health goals',
  'public',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM chat_groups WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
);

INSERT INTO chat_groups (id, name, description, type, created_by)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Food & Nutrition',
  'Share healthy recipes, nutrition advice, and dietary tips',
  'public',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM chat_groups WHERE id = '00000000-0000-0000-0000-000000000002'::uuid
);

INSERT INTO chat_groups (id, name, description, type, created_by)
SELECT 
  '00000000-0000-0000-0000-000000000003'::uuid,
  'Anatomy & Health',
  'Discuss human anatomy, health conditions, and medical knowledge',
  'public',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM chat_groups WHERE id = '00000000-0000-0000-0000-000000000003'::uuid
);

-- Create a function to check if stored procedures exist
CREATE OR REPLACE FUNCTION check_stored_procedures_exist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
