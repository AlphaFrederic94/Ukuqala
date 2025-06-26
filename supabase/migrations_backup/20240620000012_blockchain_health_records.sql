-- Create blockchain_health_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS blockchain_health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  record_hash TEXT NOT NULL,
  blockchain_id TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blockchain_health_record_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS blockchain_health_record_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES blockchain_health_records(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blockchain_health_records
ALTER TABLE blockchain_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_health_record_access ENABLE ROW LEVEL SECURITY;

-- Create policies for blockchain_health_records
CREATE POLICY "Users can view their own health records"
ON blockchain_health_records FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own health records"
ON blockchain_health_records FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own health records"
ON blockchain_health_records FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own health records"
ON blockchain_health_records FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create policies for blockchain_health_record_access
CREATE POLICY "Users can view access to their own health records"
ON blockchain_health_record_access FOR SELECT
TO authenticated
USING (
  record_id IN (
    SELECT id FROM blockchain_health_records WHERE user_id = auth.uid()
  )
  OR
  provider_user_id = auth.uid()
);

CREATE POLICY "Users can grant access to their own health records"
ON blockchain_health_record_access FOR INSERT
TO authenticated
WITH CHECK (
  record_id IN (
    SELECT id FROM blockchain_health_records WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can revoke access to their own health records"
ON blockchain_health_record_access FOR UPDATE
TO authenticated
USING (
  record_id IN (
    SELECT id FROM blockchain_health_records WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete access to their own health records"
ON blockchain_health_record_access FOR DELETE
TO authenticated
USING (
  record_id IN (
    SELECT id FROM blockchain_health_records WHERE user_id = auth.uid()
  )
);
