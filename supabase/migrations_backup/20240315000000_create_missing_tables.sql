-- Create exercise_sessions table
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    date timestamp with time zone DEFAULT now(),
    duration integer NOT NULL,
    type varchar(255),
    calories_burned integer,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    specialty varchar(255) NOT NULL,
    rating decimal(2,1),
    location varchar(255),
    image varchar(255),
    availability jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Add LinkedIn column to doctors table
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

-- Insert example doctors with LinkedIn URLs
-- We'll use INSERT instead of UPDATE since we don't know the UUIDs in advance
INSERT INTO public.doctors (name, specialty, rating, location, image, linkedin_url)
VALUES
    ('Dr. Smith', 'Cardiology', 4.8, 'New York', '/images/doctors/smith.jpg', 'https://www.linkedin.com/in/dr-smith-cardio'),
    ('Dr. Jones', 'Neurology', 4.7, 'Boston', '/images/doctors/jones.jpg', 'https://www.linkedin.com/in/dr-jones-neuro'),
    ('Dr. Wilson', 'Dermatology', 4.9, 'Chicago', '/images/doctors/wilson.jpg', 'https://www.linkedin.com/in/dr-wilson-derm')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view and manage their own exercise sessions"
    ON public.exercise_sessions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all doctors"
    ON public.doctors
    FOR SELECT
    TO authenticated
    USING (true);

-- Create indexes
CREATE INDEX exercise_sessions_user_id_idx ON public.exercise_sessions(user_id);
CREATE INDEX exercise_sessions_date_idx ON public.exercise_sessions(date);
CREATE INDEX doctors_specialty_idx ON public.doctors(specialty);
