-- Create health facilities table if it doesn't exist
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

-- Create disease outbreaks table if it doesn't exist
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

-- Create health events table if it doesn't exist
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

-- Insert sample health facilities data
INSERT INTO health_facilities (name, category, address, latitude, longitude, phone, hours, wait_time, services)
VALUES
  ('City General Hospital', 'Hospital', '123 Main St, Cityville', 51.505, -0.09, '555-1234', 'Open 24/7', '30-45 min', '["Emergency Care", "Surgery", "Pediatrics", "Cardiology", "Neurology"]'),
  ('Westside Medical Clinic', 'Clinic', '456 West Ave, Cityville', 51.51, -0.1, '555-5678', 'Mon-Fri 8am-6pm', '15-20 min', '["General Medicine", "Vaccinations", "Lab Tests", "Physical Therapy"]'),
  ('Eastside Health Center', 'Clinic', '789 East Blvd, Cityville', 51.515, -0.08, '555-9012', 'Mon-Sat 9am-5pm', '10-15 min', '["Family Medicine", "Women''s Health", "Mental Health", "Nutrition Counseling"]'),
  ('Central Pharmacy', 'Pharmacy', '321 Center St, Cityville', 51.508, -0.095, '555-3456', 'Mon-Sun 8am-10pm', 'No wait', '["Prescription Filling", "Medication Counseling", "Vaccinations", "Health Screenings"]'),
  ('North Medical Laboratory', 'Laboratory', '654 North Rd, Cityville', 51.52, -0.085, '555-7890', 'Mon-Fri 7am-7pm, Sat 8am-2pm', '5-10 min', '["Blood Tests", "Urinalysis", "COVID Testing", "Genetic Testing"]'),
  ('South Community Health', 'Clinic', '987 South St, Cityville', 51.5, -0.105, '555-2345', 'Mon-Fri 8:30am-4:30pm', '20-30 min', '["Primary Care", "Pediatrics", "Geriatrics", "Chronic Disease Management"]')
ON CONFLICT DO NOTHING;

-- Insert sample disease outbreaks data
INSERT INTO disease_outbreaks (disease, severity, cases, latitude, longitude, start_date, status, description)
VALUES
  ('Influenza', 'medium', 45, 51.53, -0.12, NOW() - INTERVAL '2 weeks', 'Active', 'Seasonal flu outbreak with moderate spread in the northern part of the city.'),
  ('COVID-19', 'high', 78, 51.49, -0.11, NOW() - INTERVAL '1 month', 'Active', 'COVID-19 cluster with significant community transmission.'),
  ('Gastroenteritis', 'low', 23, 51.51, -0.07, NOW() - INTERVAL '1 week', 'Active', 'Foodborne illness outbreak linked to a local restaurant.')
ON CONFLICT DO NOTHING;

-- Insert sample health events data
INSERT INTO health_events (name, category, location, latitude, longitude, date, time, organizer, description)
VALUES
  ('Free Vaccination Drive', 'Vaccination', 'City Park, Cityville', 51.507, -0.11, NOW() + INTERVAL '1 week', '9:00 AM - 4:00 PM', 'City Health Department', 'Free flu and COVID-19 vaccinations for all residents.'),
  ('Blood Donation Camp', 'Blood Drive', 'Community Center, Cityville', 51.515, -0.095, NOW() + INTERVAL '2 weeks', '10:00 AM - 6:00 PM', 'Red Cross', 'Donate blood and save lives. All blood types needed.'),
  ('Diabetes Screening', 'Screening', 'Westside Medical Clinic', 51.51, -0.1, NOW() + INTERVAL '3 days', '1:00 PM - 5:00 PM', 'Diabetes Association', 'Free diabetes screening and risk assessment.'),
  ('Mental Health Awareness Workshop', 'Education', 'City Library, Cityville', 51.505, -0.085, NOW() + INTERVAL '10 days', '6:00 PM - 8:00 PM', 'Mental Health Alliance', 'Learn about mental health, stress management, and available resources.')
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;

-- Create policies for health facilities
CREATE POLICY "Health facilities are viewable by all users"
ON health_facilities FOR SELECT
TO authenticated
USING (true);

-- Create policies for disease outbreaks
CREATE POLICY "Disease outbreaks are viewable by all users"
ON disease_outbreaks FOR SELECT
TO authenticated
USING (true);

-- Create policies for health events
CREATE POLICY "Health events are viewable by all users"
ON health_events FOR SELECT
TO authenticated
USING (true);
