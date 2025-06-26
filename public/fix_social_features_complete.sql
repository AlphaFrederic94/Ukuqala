-- CareAI Social Features Fix Script
-- This script fixes issues with the social features

-- First, add the role column to chat_group_members if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_group_members'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE chat_group_members ADD COLUMN role TEXT NOT NULL DEFAULT 'member';
    RAISE NOTICE 'Added role column to chat_group_members table';
  ELSE
    RAISE NOTICE 'role column already exists in chat_group_members table';
  END IF;
END
$$;

-- Drop and recreate the get_latest_messages_sent function
DROP FUNCTION IF EXISTS get_latest_messages_sent(UUID);

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
    cm.is_read AS read, -- Note: column is named is_read in your schema
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

-- Create or replace the get_user_chat_groups function
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
    NULL::TEXT AS image_url, -- Your schema doesn't have image_url in chat_groups
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

-- Helper function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(policy_name text, table_name text)
RETURNS boolean AS $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname = policy_name
  AND tablename = table_name;

  RETURN policy_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create or replace stored procedures for triggers
CREATE OR REPLACE FUNCTION handle_new_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's post count if the column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'posts_count'
  ) THEN
    UPDATE profiles
    SET posts_count = COALESCE(posts_count, 0) + 1
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create triggers if they don't exist
DO $$
BEGIN
  -- Check if the trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tr_handle_new_post'
    AND tgrelid = 'social_posts'::regclass
  ) THEN
    -- Create the trigger
    CREATE TRIGGER tr_handle_new_post
      AFTER INSERT ON social_posts
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_post();
    RAISE NOTICE 'Created tr_handle_new_post trigger';
  ELSE
    RAISE NOTICE 'tr_handle_new_post trigger already exists';
  END IF;

  -- Check if the trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tr_handle_new_comment'
    AND tgrelid = 'post_comments'::regclass
  ) THEN
    -- Create the trigger
    CREATE TRIGGER tr_handle_new_comment
      AFTER INSERT ON post_comments
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_comment();
    RAISE NOTICE 'Created tr_handle_new_comment trigger';
  ELSE
    RAISE NOTICE 'tr_handle_new_comment trigger already exists';
  END IF;

  -- Check if the trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tr_handle_new_like'
    AND tgrelid = 'post_likes'::regclass
  ) THEN
    -- Create the trigger
    CREATE TRIGGER tr_handle_new_like
      AFTER INSERT ON post_likes
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_like();
    RAISE NOTICE 'Created tr_handle_new_like trigger';
  ELSE
    RAISE NOTICE 'tr_handle_new_like trigger already exists';
  END IF;
END
$$;

-- Enable RLS on all tables
DO $$
BEGIN
  -- Enable RLS on all tables
  ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_friendships ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chat_group_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Enabled RLS on all social tables';
END
$$;

-- Create missing policies
DO $$
BEGIN
  -- social_posts policies
  IF NOT policy_exists('Anyone can view posts', 'social_posts') THEN
    CREATE POLICY "Anyone can view posts"
      ON social_posts FOR SELECT
      USING (true);
    RAISE NOTICE 'Created "Anyone can view posts" policy';
  END IF;

  IF NOT policy_exists('Users can insert their own posts', 'social_posts') THEN
    CREATE POLICY "Users can insert their own posts"
      ON social_posts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can insert their own posts" policy';
  END IF;

  IF NOT policy_exists('Users can update their own posts', 'social_posts') THEN
    CREATE POLICY "Users can update their own posts"
      ON social_posts FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can update their own posts" policy';
  END IF;

  IF NOT policy_exists('Users can delete their own posts', 'social_posts') THEN
    CREATE POLICY "Users can delete their own posts"
      ON social_posts FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can delete their own posts" policy';
  END IF;

  -- post_comments policies
  IF NOT policy_exists('Anyone can view comments', 'post_comments') THEN
    CREATE POLICY "Anyone can view comments"
      ON post_comments FOR SELECT
      USING (true);
    RAISE NOTICE 'Created "Anyone can view comments" policy';
  END IF;

  IF NOT policy_exists('Users can insert their own comments', 'post_comments') THEN
    CREATE POLICY "Users can insert their own comments"
      ON post_comments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can insert their own comments" policy';
  END IF;

  IF NOT policy_exists('Users can update their own comments', 'post_comments') THEN
    CREATE POLICY "Users can update their own comments"
      ON post_comments FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can update their own comments" policy';
  END IF;

  IF NOT policy_exists('Users can delete their own comments', 'post_comments') THEN
    CREATE POLICY "Users can delete their own comments"
      ON post_comments FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can delete their own comments" policy';
  END IF;

  -- post_likes policies
  IF NOT policy_exists('Anyone can view likes', 'post_likes') THEN
    CREATE POLICY "Anyone can view likes"
      ON post_likes FOR SELECT
      USING (true);
    RAISE NOTICE 'Created "Anyone can view likes" policy';
  END IF;

  IF NOT policy_exists('Users can insert their own likes', 'post_likes') THEN
    CREATE POLICY "Users can insert their own likes"
      ON post_likes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can insert their own likes" policy';
  END IF;

  IF NOT policy_exists('Users can delete their own likes', 'post_likes') THEN
    CREATE POLICY "Users can delete their own likes"
      ON post_likes FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can delete their own likes" policy';
  END IF;

  -- user_friendships policies
  IF NOT policy_exists('Users can view their own friendships', 'user_friendships') THEN
    CREATE POLICY "Users can view their own friendships"
      ON user_friendships FOR SELECT
      USING (auth.uid() = user_id OR auth.uid() = friend_id);
    RAISE NOTICE 'Created "Users can view their own friendships" policy';
  END IF;

  IF NOT policy_exists('Users can insert their own friendship requests', 'user_friendships') THEN
    CREATE POLICY "Users can insert their own friendship requests"
      ON user_friendships FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can insert their own friendship requests" policy';
  END IF;

  IF NOT policy_exists('Users can update friendships they''re part of', 'user_friendships') THEN
    CREATE POLICY "Users can update friendships they're part of"
      ON user_friendships FOR UPDATE
      USING (auth.uid() = user_id OR auth.uid() = friend_id);
    RAISE NOTICE 'Created "Users can update friendships they''re part of" policy';
  END IF;

  IF NOT policy_exists('Users can delete friendships they''re part of', 'user_friendships') THEN
    CREATE POLICY "Users can delete friendships they're part of"
      ON user_friendships FOR DELETE
      USING (auth.uid() = user_id OR auth.uid() = friend_id);
    RAISE NOTICE 'Created "Users can delete friendships they''re part of" policy';
  END IF;

  -- chat_messages policies
  IF NOT policy_exists('Users can view messages they sent or received', 'chat_messages') THEN
    CREATE POLICY "Users can view messages they sent or received"
      ON chat_messages FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
    RAISE NOTICE 'Created "Users can view messages they sent or received" policy';
  END IF;

  IF NOT policy_exists('Users can insert messages they send', 'chat_messages') THEN
    CREATE POLICY "Users can insert messages they send"
      ON chat_messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
    RAISE NOTICE 'Created "Users can insert messages they send" policy';
  END IF;

  IF NOT policy_exists('Users can update messages they sent or received', 'chat_messages') THEN
    CREATE POLICY "Users can update messages they sent or received"
      ON chat_messages FOR UPDATE
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
    RAISE NOTICE 'Created "Users can update messages they sent or received" policy';
  END IF;

  IF NOT policy_exists('Users can delete messages they sent', 'chat_messages') THEN
    CREATE POLICY "Users can delete messages they sent"
      ON chat_messages FOR DELETE
      USING (auth.uid() = sender_id);
    RAISE NOTICE 'Created "Users can delete messages they sent" policy';
  END IF;

  -- chat_groups policies
  IF NOT policy_exists('Anyone can view public groups', 'chat_groups') THEN
    CREATE POLICY "Anyone can view public groups"
      ON chat_groups FOR SELECT
      USING (type = 'public' OR EXISTS (
        SELECT 1 FROM chat_group_members
        WHERE group_id = id AND user_id = auth.uid()
      ));
    RAISE NOTICE 'Created "Anyone can view public groups" policy';
  END IF;

  IF NOT policy_exists('Anyone can create groups', 'chat_groups') THEN
    CREATE POLICY "Anyone can create groups"
      ON chat_groups FOR INSERT
      WITH CHECK (auth.uid() = created_by);
    RAISE NOTICE 'Created "Anyone can create groups" policy';
  END IF;

  IF NOT policy_exists('Group admins can update groups', 'chat_groups') THEN
    CREATE POLICY "Group admins can update groups"
      ON chat_groups FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM chat_group_members
        WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
      ));
    RAISE NOTICE 'Created "Group admins can update groups" policy';
  END IF;

  IF NOT policy_exists('Group admins can delete groups', 'chat_groups') THEN
    CREATE POLICY "Group admins can delete groups"
      ON chat_groups FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM chat_group_members
        WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
      ));
    RAISE NOTICE 'Created "Group admins can delete groups" policy';
  END IF;

  -- chat_group_members policies
  IF NOT policy_exists('Anyone can view group members', 'chat_group_members') THEN
    CREATE POLICY "Anyone can view group members"
      ON chat_group_members FOR SELECT
      USING (true);
    RAISE NOTICE 'Created "Anyone can view group members" policy';
  END IF;

  IF NOT policy_exists('Users can join public groups', 'chat_group_members') THEN
    CREATE POLICY "Users can join public groups"
      ON chat_group_members FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM chat_groups
          WHERE id = group_id AND type = 'public'
        )
      );
    RAISE NOTICE 'Created "Users can join public groups" policy';
  END IF;

  IF NOT policy_exists('Group admins can add members', 'chat_group_members') THEN
    CREATE POLICY "Group admins can add members"
      ON chat_group_members FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM chat_group_members
          WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
        )
      );
    RAISE NOTICE 'Created "Group admins can add members" policy';
  END IF;

  IF NOT policy_exists('Group admins can update members', 'chat_group_members') THEN
    CREATE POLICY "Group admins can update members"
      ON chat_group_members FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM chat_group_members
          WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
        )
      );
    RAISE NOTICE 'Created "Group admins can update members" policy';
  END IF;

  IF NOT policy_exists('Users can leave groups', 'chat_group_members') THEN
    CREATE POLICY "Users can leave groups"
      ON chat_group_members FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can leave groups" policy';
  END IF;

  IF NOT policy_exists('Group admins can remove members', 'chat_group_members') THEN
    CREATE POLICY "Group admins can remove members"
      ON chat_group_members FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM chat_group_members
          WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
        )
      );
    RAISE NOTICE 'Created "Group admins can remove members" policy';
  END IF;

  -- chat_group_messages policies
  IF NOT policy_exists('Group members can view messages', 'chat_group_messages') THEN
    CREATE POLICY "Group members can view messages"
      ON chat_group_messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM chat_group_members
          WHERE group_id = group_id AND user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created "Group members can view messages" policy';
  END IF;

  IF NOT policy_exists('Group members can send messages', 'chat_group_messages') THEN
    CREATE POLICY "Group members can send messages"
      ON chat_group_messages FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM chat_group_members
          WHERE group_id = group_id AND user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Created "Group members can send messages" policy';
  END IF;

  IF NOT policy_exists('Users can update their own messages', 'chat_group_messages') THEN
    CREATE POLICY "Users can update their own messages"
      ON chat_group_messages FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can update their own messages" policy';
  END IF;

  IF NOT policy_exists('Users can delete their own messages', 'chat_group_messages') THEN
    CREATE POLICY "Users can delete their own messages"
      ON chat_group_messages FOR DELETE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can delete their own messages" policy';
  END IF;

  IF NOT policy_exists('Group admins can delete any message', 'chat_group_messages') THEN
    CREATE POLICY "Group admins can delete any message"
      ON chat_group_messages FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM chat_group_members
          WHERE group_id = group_id AND user_id = auth.uid() AND role = 'admin'
        )
      );
    RAISE NOTICE 'Created "Group admins can delete any message" policy';
  END IF;

  -- notifications policies
  IF NOT policy_exists('Users can view their own notifications', 'notifications') THEN
    CREATE POLICY "Users can view their own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can view their own notifications" policy';
  END IF;

  IF NOT policy_exists('Users can update their own notifications', 'notifications') THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created "Users can update their own notifications" policy';
  END IF;
END
$$;

-- Create notifications table procedure if it doesn't exist
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

-- Add missing image_url column to chat_groups if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_groups'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE chat_groups ADD COLUMN image_url TEXT;
    RAISE NOTICE 'Added image_url column to chat_groups table';
  ELSE
    RAISE NOTICE 'image_url column already exists in chat_groups table';
  END IF;
END
$$;

-- Check the chat_groups type constraint
DO $$
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'chat_groups_type_check';

  RAISE NOTICE 'Chat groups type constraint: %', constraint_def;
END
$$;

-- Add a simple function to create a chat group with the correct type
CREATE OR REPLACE FUNCTION create_chat_group(name text, description text, admin_id uuid)
RETURNS uuid AS $$
DECLARE
  group_id uuid;
  group_type text;
BEGIN
  -- Map the group name to the appropriate type based on existing values
  IF name = 'Fitness' THEN
    group_type := 'fitness';
  ELSIF name = 'Food & Nutrition' THEN
    group_type := 'food';
  ELSIF name = 'Anatomy & Health' THEN
    group_type := 'anatomy';
  ELSE
    -- Default to the first existing type if we don't have a specific mapping
    SELECT type INTO group_type FROM chat_groups LIMIT 1;

    -- If no groups exist yet, use 'fitness' as default
    IF group_type IS NULL THEN
      group_type := 'fitness';
    END IF;
  END IF;

  RAISE NOTICE 'Creating group % with type %', name, group_type;

  -- Insert the group with the appropriate type
  INSERT INTO chat_groups (name, description, type, created_by)
  VALUES (name, description, group_type, admin_id)
  RETURNING id INTO group_id;

  -- Add admin as member
  INSERT INTO chat_group_members (group_id, user_id, role)
  VALUES (group_id, admin_id, 'admin');

  RETURN group_id;
END;
$$ LANGUAGE plpgsql;

-- Create default chat groups
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get the first admin user (or any user if no admin exists)
  SELECT id INTO admin_id FROM auth.users LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Create Fitness group if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM chat_groups WHERE name = 'Fitness') THEN
      PERFORM create_chat_group('Fitness', 'Discuss workout routines, fitness goals, and exercise tips', admin_id);
      RAISE NOTICE 'Created Fitness group';
    END IF;

    -- Create Food & Nutrition group if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM chat_groups WHERE name = 'Food & Nutrition') THEN
      PERFORM create_chat_group('Food & Nutrition', 'Share healthy recipes, nutrition advice, and dietary tips', admin_id);
      RAISE NOTICE 'Created Food & Nutrition group';
    END IF;

    -- Create Anatomy & Health group if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM chat_groups WHERE name = 'Anatomy & Health') THEN
      PERFORM create_chat_group('Anatomy & Health', 'Discuss general health topics, medical information, and wellness', admin_id);
      RAISE NOTICE 'Created Anatomy & Health group';
    END IF;
  END IF;
END
$$;
