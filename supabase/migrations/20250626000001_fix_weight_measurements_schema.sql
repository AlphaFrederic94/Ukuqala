-- Fix weight_measurements table schema conflicts
-- This migration ensures the table has the correct schema with all required columns

-- Drop the table if it exists to recreate with correct schema
DROP TABLE IF EXISTS public.weight_measurements CASCADE;

-- Create weight_measurements table with correct schema
CREATE TABLE public.weight_measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weight decimal(5,2) NOT NULL,
    date timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weight_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own weight measurements"
    ON public.weight_measurements
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX weight_measurements_user_id_idx ON public.weight_measurements(user_id);
CREATE INDEX weight_measurements_user_date_idx ON public.weight_measurements(user_id, date);

-- Grant necessary permissions
GRANT ALL ON public.weight_measurements TO authenticated;
GRANT ALL ON public.weight_measurements TO service_role;
