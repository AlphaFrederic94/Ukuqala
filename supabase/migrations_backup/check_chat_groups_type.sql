-- Check the chat_groups type constraint
SELECT pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conname = 'chat_groups_type_check';

-- Check the data type of the type column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'chat_groups' AND column_name = 'type';

-- Check existing values in the type column
SELECT DISTINCT type FROM chat_groups;
