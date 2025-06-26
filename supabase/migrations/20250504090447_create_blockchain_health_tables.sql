-- Create blockchain_health_records table
CREATE TABLE IF NOT EXISTS public.blockchain_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    encrypted_data TEXT NOT NULL,
    record_hash VARCHAR(255) NOT NULL,
    blockchain_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blockchain_health_record_access table
CREATE TABLE IF NOT EXISTS public.blockchain_health_record_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES public.blockchain_health_records(id) ON DELETE CASCADE,
    provider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(record_id, provider_user_id)
);

-- Create blockchain_health_record_verification table
CREATE TABLE IF NOT EXISTS public.blockchain_health_record_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES public.blockchain_health_records(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_verified BOOLEAN NOT NULL,
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    verification_details JSONB
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blockchain_health_records_user_id ON public.blockchain_health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_health_records_blockchain_id ON public.blockchain_health_records(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_health_record_access_record_id ON public.blockchain_health_record_access(record_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_health_record_access_provider_user_id ON public.blockchain_health_record_access(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_health_record_verification_record_id ON public.blockchain_health_record_verification(record_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.blockchain_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_health_record_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_health_record_verification ENABLE ROW LEVEL SECURITY;

-- Create policies for blockchain_health_records
CREATE POLICY "Users can view their own health records"
    ON public.blockchain_health_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records"
    ON public.blockchain_health_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records"
    ON public.blockchain_health_records FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records"
    ON public.blockchain_health_records FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for blockchain_health_record_access
CREATE POLICY "Users can view access to their own health records"
    ON public.blockchain_health_record_access FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.blockchain_health_records
            WHERE id = record_id AND user_id = auth.uid()
        )
        OR
        provider_user_id = auth.uid()
    );

CREATE POLICY "Users can grant access to their own health records"
    ON public.blockchain_health_record_access FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blockchain_health_records
            WHERE id = record_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can revoke access to their own health records"
    ON public.blockchain_health_record_access FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.blockchain_health_records
            WHERE id = record_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete access to their own health records"
    ON public.blockchain_health_record_access FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.blockchain_health_records
            WHERE id = record_id AND user_id = auth.uid()
        )
    );

-- Create policies for blockchain_health_record_verification
CREATE POLICY "Users can view verification of their own health records"
    ON public.blockchain_health_record_verification FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.blockchain_health_records
            WHERE id = record_id AND user_id = auth.uid()
        )
        OR
        verified_by = auth.uid()
    );

CREATE POLICY "Users can insert verification for health records"
    ON public.blockchain_health_record_verification FOR INSERT
    WITH CHECK (
        auth.uid() = verified_by
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_blockchain_health_record_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for blockchain_health_records updates
DROP TRIGGER IF EXISTS update_blockchain_health_record_timestamp_trigger ON public.blockchain_health_records;
CREATE TRIGGER update_blockchain_health_record_timestamp_trigger
BEFORE UPDATE ON public.blockchain_health_records
FOR EACH ROW EXECUTE FUNCTION update_blockchain_health_record_timestamp();

-- Create function to check access to health records
CREATE OR REPLACE FUNCTION check_health_record_access(record_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    -- Check if the user owns the record
    SELECT EXISTS (
        SELECT 1 FROM public.blockchain_health_records
        WHERE id = record_id AND user_id = user_id
    ) INTO has_access;

    -- If not the owner, check if access has been granted
    IF NOT has_access THEN
        SELECT EXISTS (
            SELECT 1 FROM public.blockchain_health_record_access
            WHERE record_id = record_id AND provider_user_id = user_id AND revoked_at IS NULL
        ) INTO has_access;
    END IF;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blockchain_health_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blockchain_health_record_access TO authenticated;
GRANT SELECT, INSERT ON public.blockchain_health_record_verification TO authenticated;

-- Note: We're not inserting sample data to avoid foreign key constraint issues
-- Records will be created by users through the application interface
