-- Drop existing functions first
DROP FUNCTION IF EXISTS public.schema_exists(text);
DROP FUNCTION IF EXISTS public.table_exists(text, text);

-- Create the schema_exists function with unambiguous parameter name
CREATE FUNCTION public.schema_exists(schema_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = schema_name_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the table_exists function with unambiguous parameter names
CREATE FUNCTION public.table_exists(schema_name_param TEXT, table_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = schema_name_param
    AND table_name = table_name_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
