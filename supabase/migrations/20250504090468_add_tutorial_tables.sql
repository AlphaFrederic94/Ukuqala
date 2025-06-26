-- Create table for storing user tutorial progress
CREATE TABLE IF NOT EXISTS public.user_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_tutorials TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS user_tutorials_user_id_idx ON public.user_tutorials(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tutorials
CREATE POLICY "Users can view their own tutorial data"
    ON public.user_tutorials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial data"
    ON public.user_tutorials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial data"
    ON public.user_tutorials FOR UPDATE
    USING (auth.uid() = user_id);
