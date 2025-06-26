-- Create weight_measurements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.weight_measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    weight decimal(5,2) NOT NULL,
    date timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create sleep_programs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sleep_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    duration decimal(4,2) NOT NULL,
    quality integer CHECK (quality >= 1 AND quality <= 10),
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weight_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_programs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own weight measurements" ON public.weight_measurements;
DROP POLICY IF EXISTS "Users can manage their own sleep programs" ON public.sleep_programs;

-- Create policies
CREATE POLICY "Users can manage their own weight measurements"
    ON public.weight_measurements
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sleep programs"
    ON public.sleep_programs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes
DROP INDEX IF EXISTS weight_measurements_user_date_idx;
DROP INDEX IF EXISTS sleep_programs_user_date_idx;

CREATE INDEX weight_measurements_user_date_idx ON public.weight_measurements(user_id, date);
CREATE INDEX sleep_programs_user_date_idx ON public.sleep_programs(user_id, created_at);
