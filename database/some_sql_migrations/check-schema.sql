-- Check if the student_verification schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'student_verification';

-- Check if the verifications table exists in the student_verification schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'student_verification' 
AND table_name = 'verifications';

-- Check if the RLS policies exist for the verifications table
SELECT policyname, permissive, cmd, qual
FROM pg_policies
WHERE schemaname = 'student_verification'
AND tablename = 'verifications';
