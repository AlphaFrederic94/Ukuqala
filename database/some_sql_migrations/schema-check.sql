-- Create a function to check if a schema exists
CREATE OR REPLACE FUNCTION public.schema_exists(schema_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a table exists in a schema
CREATE OR REPLACE FUNCTION public.table_exists(schema_name TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = $1
    AND table_name = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
