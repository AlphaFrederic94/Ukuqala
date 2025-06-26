-- Create user_tutorials table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_tutorials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for user_tutorials table
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tutorials" ON public.user_tutorials;
DROP POLICY IF EXISTS "Users can insert their own tutorials" ON public.user_tutorials;
DROP POLICY IF EXISTS "Users can update their own tutorials" ON public.user_tutorials;

-- Create policies
CREATE POLICY "Users can view their own tutorials"
  ON public.user_tutorials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorials"
  ON public.user_tutorials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorials"
  ON public.user_tutorials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle tutorial completion
CREATE OR REPLACE FUNCTION public.complete_tutorial(
  p_user_id UUID,
  p_tutorial_id TEXT
)
RETURNS VOID AS $$
DECLARE
  tutorial_exists BOOLEAN;
BEGIN
  -- Check if user has a record in user_tutorials
  SELECT EXISTS (
    SELECT 1 FROM public.user_tutorials WHERE user_id = p_user_id
  ) INTO tutorial_exists;
  
  -- If no record exists, create one
  IF NOT tutorial_exists THEN
    INSERT INTO public.user_tutorials (user_id, completed_tutorials)
    VALUES (p_user_id, jsonb_build_array(p_tutorial_id));
  ELSE
    -- Update existing record
    UPDATE public.user_tutorials
    SET 
      completed_tutorials = CASE 
        WHEN NOT completed_tutorials @> jsonb_build_array(p_tutorial_id) 
        THEN completed_tutorials || jsonb_build_array(p_tutorial_id)
        ELSE completed_tutorials
      END,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
