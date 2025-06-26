-- Create blockchain_health_records table
CREATE TABLE IF NOT EXISTS blockchain_health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  record_hash TEXT NOT NULL,
  blockchain_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blockchain_health_record_access table
CREATE TABLE IF NOT EXISTS blockchain_health_record_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES blockchain_health_records(id) ON DELETE CASCADE,
  provider_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(record_id, provider_user_id)
);

-- Create health_facilities table
CREATE TABLE IF NOT EXISTS health_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  hours TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  wait_time TEXT DEFAULT '0 mins',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disease_outbreaks table
CREATE TABLE IF NOT EXISTS disease_outbreaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease TEXT NOT NULL,
  severity TEXT NOT NULL,
  cases INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Active',
  symptoms JSONB DEFAULT '[]'::jsonb,
  precautions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_events table
CREATE TABLE IF NOT EXISTS health_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  organizer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bmi DOUBLE PRECISION,
  blood_pressure TEXT,
  blood_sugar INTEGER,
  cholesterol INTEGER,
  heart_rate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for blockchain tables
ALTER TABLE blockchain_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_health_record_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for blockchain_health_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view their own health records' 
    AND tablename = 'blockchain_health_records'
  ) THEN
    CREATE POLICY "Users can view their own health records"
      ON blockchain_health_records FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert their own health records' 
    AND tablename = 'blockchain_health_records'
  ) THEN
    CREATE POLICY "Users can insert their own health records"
      ON blockchain_health_records FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update their own health records' 
    AND tablename = 'blockchain_health_records'
  ) THEN
    CREATE POLICY "Users can update their own health records"
      ON blockchain_health_records FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create policies for blockchain_health_record_access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view their own health record access' 
    AND tablename = 'blockchain_health_record_access'
  ) THEN
    CREATE POLICY "Users can view their own health record access"
      ON blockchain_health_record_access FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM blockchain_health_records
        WHERE blockchain_health_records.id = blockchain_health_record_access.record_id
        AND blockchain_health_records.user_id = auth.uid()
      ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert health record access' 
    AND tablename = 'blockchain_health_record_access'
  ) THEN
    CREATE POLICY "Users can insert health record access"
      ON blockchain_health_record_access FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM blockchain_health_records
        WHERE blockchain_health_records.id = blockchain_health_record_access.record_id
        AND blockchain_health_records.user_id = auth.uid()
      ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update health record access' 
    AND tablename = 'blockchain_health_record_access'
  ) THEN
    CREATE POLICY "Users can update health record access"
      ON blockchain_health_record_access FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM blockchain_health_records
        WHERE blockchain_health_records.id = blockchain_health_record_access.record_id
        AND blockchain_health_records.user_id = auth.uid()
      ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can delete health record access' 
    AND tablename = 'blockchain_health_record_access'
  ) THEN
    CREATE POLICY "Users can delete health record access"
      ON blockchain_health_record_access FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM blockchain_health_records
        WHERE blockchain_health_records.id = blockchain_health_record_access.record_id
        AND blockchain_health_records.user_id = auth.uid()
      ));
  END IF;
END
$$;

-- Create policies for health_metrics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view their own health metrics' 
    AND tablename = 'health_metrics'
  ) THEN
    CREATE POLICY "Users can view their own health metrics"
      ON health_metrics FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert their own health metrics' 
    AND tablename = 'health_metrics'
  ) THEN
    CREATE POLICY "Users can insert their own health metrics"
      ON health_metrics FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON blockchain_health_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blockchain_health_record_access TO authenticated;
GRANT SELECT ON health_facilities TO authenticated;
GRANT SELECT ON disease_outbreaks TO authenticated;
GRANT SELECT ON health_events TO authenticated;
GRANT SELECT, INSERT ON health_metrics TO authenticated;

-- Insert sample data for health facilities
INSERT INTO health_facilities (name, category, address, latitude, longitude, phone, hours, services, wait_time)
VALUES
  ('City General Hospital', 'Hospital', '123 Main St, City Center', 51.505, -0.09, '(555) 123-4567', 'Open 24/7', '["Emergency Care", "Surgery", "Pediatrics", "Cardiology", "Neurology"]', '45 mins'),
  ('Westside Medical Clinic', 'Clinic', '456 West Ave, Westside', 51.51, -0.12, '(555) 234-5678', 'Mon-Fri: 8am-8pm, Sat: 9am-5pm', '["Primary Care", "Vaccinations", "Lab Tests", "X-Ray"]', '15 mins'),
  ('Eastside Pharmacy', 'Pharmacy', '789 East St, Eastside', 51.515, -0.07, '(555) 345-6789', 'Mon-Sat: 9am-9pm, Sun: 10am-6pm', '["Prescription Filling", "Medication Counseling", "Vaccinations", "Health Screenings"]', '5 mins')
ON CONFLICT DO NOTHING;

-- Insert sample data for disease outbreaks
INSERT INTO disease_outbreaks (disease, severity, cases, latitude, longitude, symptoms, precautions)
VALUES
  ('Seasonal Flu', 'medium', 120, 51.5, -0.11, '["Fever", "Cough", "Sore throat", "Fatigue", "Body aches"]', '["Wash hands frequently", "Wear masks in public", "Stay home if sick", "Get vaccinated"]'),
  ('COVID-19', 'high', 85, 51.52, -0.1, '["Fever", "Cough", "Shortness of breath", "Loss of taste/smell", "Fatigue"]', '["Wear masks", "Social distance", "Wash hands", "Get vaccinated", "Avoid crowds"]'),
  ('Gastroenteritis', 'low', 45, 51.49, -0.08, '["Nausea", "Vomiting", "Diarrhea", "Abdominal pain", "Fever"]', '["Wash hands thoroughly", "Clean surfaces", "Avoid sharing food/drinks", "Stay hydrated"]')
ON CONFLICT DO NOTHING;

-- Insert sample data for health events
INSERT INTO health_events (name, category, description, location, latitude, longitude, date, time, organizer)
VALUES
  ('Free Vaccination Drive', 'Vaccination', 'Free flu and COVID-19 vaccinations for all residents', 'City Community Center', 51.505, -0.1, '2023-12-15', '9:00 AM - 5:00 PM', 'City Health Department'),
  ('Blood Donation Camp', 'Blood Drive', 'Donate blood and save lives', 'Westside Mall', 51.51, -0.11, '2023-12-20', '10:00 AM - 4:00 PM', 'Red Cross'),
  ('Health Screening Fair', 'Screening', 'Free health screenings including blood pressure, cholesterol, and diabetes', 'Eastside Park', 51.515, -0.08, '2023-12-18', '11:00 AM - 3:00 PM', 'Community Health Foundation')
ON CONFLICT DO NOTHING;

-- Insert sample health metrics
INSERT INTO health_metrics (user_id, bmi, blood_pressure, blood_sugar, cholesterol, heart_rate)
SELECT 
  id, 
  24.5, 
  '120/80', 
  95, 
  180, 
  72
FROM auth.users
LIMIT 1
ON CONFLICT DO NOTHING;
