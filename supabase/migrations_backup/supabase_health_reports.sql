-- Create health_reports table
CREATE TABLE IF NOT EXISTS health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  symptom TEXT,
  disease TEXT,
  severity TEXT,
  location_name TEXT NOT NULL,
  description TEXT,
  latitude FLOAT,
  longitude FLOAT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on health_reports table
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for health_reports
CREATE POLICY "Health reports are viewable by all authenticated users"
ON health_reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own health reports"
ON health_reports FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR is_anonymous = true
);

CREATE POLICY "Users can update their own health reports"
ON health_reports FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own health reports"
ON health_reports FOR DELETE
TO authenticated
USING (user_id = auth.uid());
