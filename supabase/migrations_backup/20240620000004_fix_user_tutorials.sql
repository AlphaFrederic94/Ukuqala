-- Create user_tutorials table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_tutorials JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON public.user_tutorials(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tutorial data"
    ON public.user_tutorials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial data"
    ON public.user_tutorials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial data"
    ON public.user_tutorials FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_tutorials TO authenticated;
