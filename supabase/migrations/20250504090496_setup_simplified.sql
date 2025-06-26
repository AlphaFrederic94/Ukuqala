-- Create blockchain_health_records table
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

-- Create blockchain_health_record_access table
CREATE TABLE IF NOT EXISTS blockchain_health_record_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES blockchain_health_records(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health facilities table
CREATE TABLE IF NOT EXISTS health_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  phone TEXT,
  hours TEXT,
  wait_time TEXT,
  services JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disease outbreaks table
CREATE TABLE IF NOT EXISTS disease_outbreaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease TEXT NOT NULL,
  severity TEXT NOT NULL,
  cases INTEGER NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health events table
CREATE TABLE IF NOT EXISTS health_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT,
  organizer TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add avatar_url column to profiles table if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END$$;

-- Enable RLS on tables
ALTER TABLE blockchain_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_health_record_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;

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

-- Create policies for health map tables
CREATE POLICY "Health facilities are viewable by all users"
ON health_facilities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Disease outbreaks are viewable by all users"
ON disease_outbreaks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Health events are viewable by all users"
ON health_events FOR SELECT
TO authenticated
USING (true);
