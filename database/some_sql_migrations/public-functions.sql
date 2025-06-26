-- Create public schema functions that call the student_verification schema functions
-- This helps with RPC calls that might have issues with schema qualification

-- Create function to check if a user is a verified student
CREATE OR REPLACE FUNCTION public.is_verified_student(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Call the schema-qualified function
  RETURN student_verification.is_verified_student(p_user_id);
EXCEPTION
  WHEN undefined_function THEN
    -- Fallback implementation if the schema function doesn't exist
    RETURN EXISTS (
      SELECT 1
      FROM student_verification.verifications
      WHERE user_id = p_user_id AND verification_status = 'verified'
    );
  WHEN undefined_table THEN
    -- Fallback if the table doesn't exist
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get verification status for a user
CREATE OR REPLACE FUNCTION public.get_verification_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Call the schema-qualified function
  RETURN student_verification.get_verification_status(p_user_id);
EXCEPTION
  WHEN undefined_function THEN
    -- Fallback implementation if the schema function doesn't exist
    SELECT verification_status INTO v_status
    FROM student_verification.verifications
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_status, 'none');
  WHEN undefined_table THEN
    -- Fallback if the table doesn't exist
    RETURN 'none';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
