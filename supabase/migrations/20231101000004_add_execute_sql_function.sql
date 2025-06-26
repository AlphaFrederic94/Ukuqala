-- Add a function to execute SQL queries safely
-- This is needed for the peerForumSetupService.ts to create tables and functions

-- Create the execute_sql function
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;
