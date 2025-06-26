-- Create table for storing user encryption keys
CREATE TABLE IF NOT EXISTS public.user_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create table for storing encrypted user data
CREATE TABLE IF NOT EXISTS public.encrypted_user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    encrypted_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS user_encryption_keys_user_id_idx ON public.user_encryption_keys(user_id);
CREATE INDEX IF NOT EXISTS encrypted_user_data_user_id_idx ON public.encrypted_user_data(user_id);
CREATE INDEX IF NOT EXISTS encrypted_user_data_data_type_idx ON public.encrypted_user_data(data_type);
CREATE INDEX IF NOT EXISTS encrypted_user_data_user_id_data_type_idx ON public.encrypted_user_data(user_id, data_type);

-- Enable Row Level Security
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_user_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user_encryption_keys
CREATE POLICY "Users can view their own encryption keys"
    ON public.user_encryption_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own encryption keys"
    ON public.user_encryption_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption keys"
    ON public.user_encryption_keys FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for encrypted_user_data
CREATE POLICY "Users can view their own encrypted data"
    ON public.encrypted_user_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own encrypted data"
    ON public.encrypted_user_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encrypted data"
    ON public.encrypted_user_data FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own encrypted data"
    ON public.encrypted_user_data FOR DELETE
    USING (auth.uid() = user_id);
