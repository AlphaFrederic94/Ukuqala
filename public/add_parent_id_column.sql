-- Add parent_id column to post_comments table if it doesn't exist
DO $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'post_comments'
    AND column_name = 'parent_id'
  ) THEN
    -- Add the column
    ALTER TABLE post_comments ADD COLUMN parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;
    
    -- Create an index on the new column
    CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
    
    RAISE NOTICE 'Added parent_id column to post_comments table';
  ELSE
    RAISE NOTICE 'parent_id column already exists in post_comments table';
  END IF;
END
$$;
