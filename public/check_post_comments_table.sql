-- Check the structure of the post_comments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'post_comments'
ORDER BY ordinal_position;
