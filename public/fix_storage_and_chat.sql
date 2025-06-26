-- Fix Storage Bucket Issues and Chat Group Messaging

-- 1. Fix Storage Bucket Issues
DO $$
BEGIN
  -- Check if the 'social' bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'social') THEN
    -- Make sure it's public
    UPDATE storage.buckets SET public = true WHERE name = 'social';
    RAISE NOTICE 'Updated social bucket to be public';
  ELSE
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social', 'social', true);
    RAISE NOTICE 'Created social bucket';
  END IF;

  -- Create storage policies for the social bucket
  -- Allow authenticated users to upload files
  BEGIN
    CREATE POLICY "Allow authenticated users to upload files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'social');
    RAISE NOTICE 'Created upload policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Upload policy already exists for social bucket';
  END;

  -- Allow public access to read files
  BEGIN
    CREATE POLICY "Allow public access to social files"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'social');
    RAISE NOTICE 'Created public read policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Public read policy already exists for social bucket';
  END;

  -- Allow users to update and delete their own files
  BEGIN
    CREATE POLICY "Allow users to update their own files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'social' AND owner = auth.uid());
    RAISE NOTICE 'Created update policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Update policy already exists for social bucket';
  END;

  BEGIN
    CREATE POLICY "Allow users to delete their own files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'social' AND owner = auth.uid());
    RAISE NOTICE 'Created delete policy for social bucket';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Delete policy already exists for social bucket';
  END;
END
$$;

-- 2. Fix Chat Group Messaging Issues

-- Check if is_sticker column exists in chat_group_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_group_messages' AND column_name = 'is_sticker'
  ) THEN
    ALTER TABLE chat_group_messages ADD COLUMN is_sticker BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_sticker column to chat_group_messages table';
  ELSE
    RAISE NOTICE 'is_sticker column already exists in chat_group_messages table';
  END IF;
END
$$;

-- Create or replace function to send a message to a chat group
CREATE OR REPLACE FUNCTION send_chat_group_message(
  p_group_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_is_sticker BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Check if the user is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM chat_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this group';
  END IF;

  -- Insert the message
  INSERT INTO chat_group_messages (group_id, user_id, content, is_sticker)
  VALUES (p_group_id, p_user_id, p_content, p_is_sticker)
  RETURNING id INTO message_id;

  -- Create a welcome message if this is the first message in the group
  IF (SELECT COUNT(*) FROM chat_group_messages WHERE group_id = p_group_id) = 1 THEN
    -- Get the group name
    DECLARE
      group_name TEXT;
    BEGIN
      SELECT name INTO group_name FROM chat_groups WHERE id = p_group_id;

      -- Insert a system welcome message
      INSERT INTO chat_group_messages (group_id, user_id, content)
      VALUES (
        p_group_id,
        p_user_id,
        'Welcome to the ' || group_name || ' group! This is a space to discuss ' ||
        CASE
          WHEN group_name = 'Fitness' THEN 'workout routines, fitness goals, and exercise tips.'
          WHEN group_name = 'Food & Nutrition' THEN 'healthy recipes, nutrition advice, and dietary tips.'
          WHEN group_name = 'Anatomy & Health' THEN 'general health topics, medical information, and wellness.'
          ELSE 'health-related topics.'
        END
      );
    END;
  END IF;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Test the chat group messaging by adding a test message to each group
DO $$
DECLARE
  admin_id UUID;
  fitness_id UUID;
  food_id UUID;
  anatomy_id UUID;
BEGIN
  -- Get the first admin user (or any user if no admin exists)
  SELECT id INTO admin_id FROM auth.users LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Get group IDs
    SELECT id INTO fitness_id FROM chat_groups WHERE name = 'Fitness' LIMIT 1;
    SELECT id INTO food_id FROM chat_groups WHERE name = 'Food & Nutrition' LIMIT 1;
    SELECT id INTO anatomy_id FROM chat_groups WHERE name = 'Anatomy & Health' LIMIT 1;

    -- Add test messages if groups exist
    IF fitness_id IS NOT NULL THEN
      -- Check if the user is a member of the group
      IF NOT EXISTS (SELECT 1 FROM chat_group_members WHERE group_id = fitness_id AND user_id = admin_id) THEN
        -- Add the user as a member
        INSERT INTO chat_group_members (group_id, user_id, role)
        VALUES (fitness_id, admin_id, 'admin');
      END IF;

      -- Add a test message
      PERFORM send_chat_group_message(fitness_id, admin_id, 'Welcome to the Fitness group! Let''s discuss workout routines and fitness goals.');
      RAISE NOTICE 'Added test message to Fitness group';
    END IF;

    IF food_id IS NOT NULL THEN
      -- Check if the user is a member of the group
      IF NOT EXISTS (SELECT 1 FROM chat_group_members WHERE group_id = food_id AND user_id = admin_id) THEN
        -- Add the user as a member
        INSERT INTO chat_group_members (group_id, user_id, role)
        VALUES (food_id, admin_id, 'admin');
      END IF;

      -- Add a test message
      PERFORM send_chat_group_message(food_id, admin_id, 'Welcome to the Food & Nutrition group! Let''s share healthy recipes and nutrition advice.');
      RAISE NOTICE 'Added test message to Food & Nutrition group';
    END IF;

    IF anatomy_id IS NOT NULL THEN
      -- Check if the user is a member of the group
      IF NOT EXISTS (SELECT 1 FROM chat_group_members WHERE group_id = anatomy_id AND user_id = admin_id) THEN
        -- Add the user as a member
        INSERT INTO chat_group_members (group_id, user_id, role)
        VALUES (anatomy_id, admin_id, 'admin');
      END IF;

      -- Add a test message
      PERFORM send_chat_group_message(anatomy_id, admin_id, 'Welcome to the Anatomy & Health group! Let''s discuss general health topics and wellness.');
      RAISE NOTICE 'Added test message to Anatomy & Health group';
    END IF;
  END IF;
END
$$;
