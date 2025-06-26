-- Create health_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bmi NUMERIC(5,2),
    blood_pressure VARCHAR(10),
    blood_sugar INTEGER,
    cholesterol INTEGER,
    alt INTEGER,
    creatinine NUMERIC(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health_history table to track changes over time
CREATE TABLE IF NOT EXISTS public.health_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,
    metric_value VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create medications table to track user medications
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health_simulations table to save simulation results
CREATE TABLE IF NOT EXISTS public.health_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulation_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON public.health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_history_user_id ON public.health_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_health_simulations_user_id ON public.health_simulations(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies for health_metrics
CREATE POLICY "Users can view their own health metrics"
    ON public.health_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
    ON public.health_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
    ON public.health_metrics FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics"
    ON public.health_metrics FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for health_history
CREATE POLICY "Users can view their own health history"
    ON public.health_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health history"
    ON public.health_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health history"
    ON public.health_history FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for medications
CREATE POLICY "Users can view their own medications"
    ON public.medications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
    ON public.medications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
    ON public.medications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
    ON public.medications FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for health_simulations
CREATE POLICY "Users can view their own health simulations"
    ON public.health_simulations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health simulations"
    ON public.health_simulations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health simulations"
    ON public.health_simulations FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update health_history when health_metrics are updated
CREATE OR REPLACE FUNCTION update_health_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Record BMI change
    IF OLD.bmi IS DISTINCT FROM NEW.bmi THEN
        INSERT INTO public.health_history (user_id, metric_name, metric_value)
        VALUES (NEW.user_id, 'bmi', NEW.bmi::text);
    END IF;
    
    -- Record blood pressure change
    IF OLD.blood_pressure IS DISTINCT FROM NEW.blood_pressure THEN
        INSERT INTO public.health_history (user_id, metric_name, metric_value)
        VALUES (NEW.user_id, 'blood_pressure', NEW.blood_pressure);
    END IF;
    
    -- Record blood sugar change
    IF OLD.blood_sugar IS DISTINCT FROM NEW.blood_sugar THEN
        INSERT INTO public.health_history (user_id, metric_name, metric_value)
        VALUES (NEW.user_id, 'blood_sugar', NEW.blood_sugar::text);
    END IF;
    
    -- Record cholesterol change
    IF OLD.cholesterol IS DISTINCT FROM NEW.cholesterol THEN
        INSERT INTO public.health_history (user_id, metric_name, metric_value)
        VALUES (NEW.user_id, 'cholesterol', NEW.cholesterol::text);
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health_metrics updates
DROP TRIGGER IF EXISTS update_health_history_trigger ON public.health_metrics;
CREATE TRIGGER update_health_history_trigger
BEFORE UPDATE ON public.health_metrics
FOR EACH ROW EXECUTE FUNCTION update_health_history();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_metrics TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.health_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.health_simulations TO authenticated;
