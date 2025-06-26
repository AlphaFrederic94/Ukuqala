-- Create user_tutorials table
CREATE TABLE IF NOT EXISTS public.user_tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_tutorials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON public.user_tutorials(user_id);

-- Add RLS policies
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own tutorials
CREATE POLICY select_own_tutorials ON public.user_tutorials
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own tutorials
CREATE POLICY insert_own_tutorials ON public.user_tutorials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own tutorials
CREATE POLICY update_own_tutorials ON public.user_tutorials
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_tutorials TO authenticated;
GRANT SELECT ON public.user_tutorials TO anon;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tutorials_updated_at
BEFORE UPDATE ON public.user_tutorials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
