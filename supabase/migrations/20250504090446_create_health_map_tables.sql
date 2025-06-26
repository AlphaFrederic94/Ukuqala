-- Create health_facilities table
CREATE TABLE IF NOT EXISTS public.health_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    hours TEXT,
    services JSONB,
    wait_time VARCHAR(50),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create disease_outbreaks table
CREATE TABLE IF NOT EXISTS public.disease_outbreaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disease VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    cases INTEGER NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    symptoms JSONB,
    precautions JSONB,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health_events table
CREATE TABLE IF NOT EXISTS public.health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50),
    location TEXT,
    description TEXT,
    organizer VARCHAR(100),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health_reports table
CREATE TABLE IF NOT EXISTS public.health_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    symptom VARCHAR(100),
    disease VARCHAR(100),
    severity VARCHAR(20),
    location_name TEXT,
    description TEXT,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health_metrics_regions table for regional health data
CREATE TABLE IF NOT EXISTS public.health_metrics_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value NUMERIC(10, 2) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    radius NUMERIC(10, 2), -- in kilometers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_facilities_location ON public.health_facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_disease_outbreaks_location ON public.disease_outbreaks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_health_events_location ON public.health_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_health_reports_location ON public.health_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON public.health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_regions_location ON public.health_metrics_regions(latitude, longitude);

-- Enable Row Level Security on all tables
ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics_regions ENABLE ROW LEVEL SECURITY;

-- Create policies for health_facilities
CREATE POLICY "Health facilities are viewable by everyone"
    ON public.health_facilities FOR SELECT
    USING (true);

CREATE POLICY "Health facilities can be created by authenticated users"
    ON public.health_facilities FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Health facilities can be updated by authenticated users"
    ON public.health_facilities FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create policies for disease_outbreaks
CREATE POLICY "Disease outbreaks are viewable by everyone"
    ON public.disease_outbreaks FOR SELECT
    USING (true);

CREATE POLICY "Disease outbreaks can be created by authenticated users"
    ON public.disease_outbreaks FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Disease outbreaks can be updated by authenticated users"
    ON public.disease_outbreaks FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create policies for health_events
CREATE POLICY "Health events are viewable by everyone"
    ON public.health_events FOR SELECT
    USING (true);

CREATE POLICY "Health events can be created by authenticated users"
    ON public.health_events FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Health events can be updated by authenticated users"
    ON public.health_events FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create policies for health_reports
CREATE POLICY "Health reports are viewable by everyone"
    ON public.health_reports FOR SELECT
    USING (is_verified = true OR auth.role() = 'authenticated');

CREATE POLICY "Health reports can be created by anyone"
    ON public.health_reports FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Health reports can be updated by the creator"
    ON public.health_reports FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Create policies for health_metrics_regions
CREATE POLICY "Health metrics regions are viewable by everyone"
    ON public.health_metrics_regions FOR SELECT
    USING (true);

CREATE POLICY "Health metrics regions can be created by authenticated users"
    ON public.health_metrics_regions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Health metrics regions can be updated by authenticated users"
    ON public.health_metrics_regions FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create function to process health reports
CREATE OR REPLACE FUNCTION process_health_report()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a symptom report and there are multiple similar reports in the area,
    -- create or update a disease outbreak
    IF NEW.report_type = 'symptom' AND NEW.is_verified = true THEN
        -- Check for similar reports in the area (within ~1km)
        DECLARE
            similar_reports INTEGER;
        BEGIN
            SELECT COUNT(*)
            INTO similar_reports
            FROM public.health_reports
            WHERE report_type = 'symptom'
              AND (symptom ILIKE '%' || NEW.symptom || '%' OR NEW.symptom ILIKE '%' || symptom || '%')
              AND is_verified = true
              AND created_at > (NOW() - INTERVAL '14 days')
              AND ST_DistanceSphere(
                  ST_MakePoint(longitude, latitude),
                  ST_MakePoint(NEW.longitude, NEW.latitude)
              ) < 1000; -- Within 1km
        END;

        -- If there are at least 3 similar reports, create or update an outbreak
        IF similar_reports >= 3 THEN
            -- Check if an outbreak already exists
            DECLARE
                existing_outbreak UUID;
                outbreak_severity VARCHAR(20);
            BEGIN
                SELECT id
                INTO existing_outbreak
                FROM public.disease_outbreaks
                WHERE (disease ILIKE '%' || NEW.symptom || '%' OR NEW.symptom ILIKE '%' || disease || '%')
                  AND ST_DistanceSphere(
                      ST_MakePoint(longitude, latitude),
                      ST_MakePoint(NEW.longitude, NEW.latitude)
                  ) < 2000 -- Within 2km
                  AND status = 'Active';

                -- Determine severity based on number of reports
                IF similar_reports >= 10 THEN
                    outbreak_severity := 'high';
                ELSIF similar_reports >= 5 THEN
                    outbreak_severity := 'medium';
                ELSE
                    outbreak_severity := 'low';
                END IF;

                IF existing_outbreak IS NOT NULL THEN
                    -- Update existing outbreak
                    UPDATE public.disease_outbreaks
                    SET cases = similar_reports,
                        severity = outbreak_severity,
                        updated_at = NOW()
                    WHERE id = existing_outbreak;
                ELSE
                    -- Create new outbreak
                    INSERT INTO public.disease_outbreaks (
                        disease,
                        severity,
                        cases,
                        start_date,
                        status,
                        symptoms,
                        precautions,
                        latitude,
                        longitude
                    ) VALUES (
                        COALESCE(NEW.disease, NEW.symptom),
                        outbreak_severity,
                        similar_reports,
                        CURRENT_DATE,
                        'Active',
                        jsonb_build_array(NEW.symptom),
                        jsonb_build_array('Wash hands frequently', 'Avoid close contact with sick individuals', 'Seek medical attention if symptoms worsen'),
                        NEW.latitude,
                        NEW.longitude
                    );
                END IF;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health_reports
DROP TRIGGER IF EXISTS process_health_report_trigger ON public.health_reports;
CREATE TRIGGER process_health_report_trigger
AFTER INSERT OR UPDATE ON public.health_reports
FOR EACH ROW EXECUTE FUNCTION process_health_report();

-- Grant permissions
GRANT SELECT ON public.health_facilities TO anon, authenticated;
GRANT INSERT, UPDATE ON public.health_facilities TO authenticated;

GRANT SELECT ON public.disease_outbreaks TO anon, authenticated;
GRANT INSERT, UPDATE ON public.disease_outbreaks TO authenticated;

GRANT SELECT ON public.health_events TO anon, authenticated;
GRANT INSERT, UPDATE ON public.health_events TO authenticated;

GRANT SELECT, INSERT ON public.health_reports TO anon, authenticated;
GRANT UPDATE ON public.health_reports TO authenticated;

GRANT SELECT ON public.health_metrics_regions TO anon, authenticated;
GRANT INSERT, UPDATE ON public.health_metrics_regions TO authenticated;

-- Note: We're not inserting sample data to avoid foreign key constraint issues
-- Data will be created by users through the application interface
