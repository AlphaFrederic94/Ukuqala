-- Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('heart_disease', 'diabetes', 'brain_cancer', 'skin_cancer', 'symptoms')),
    title VARCHAR(255) NOT NULL,
    result VARCHAR(50) NOT NULL,
    result_details JSONB,
    risk_level VARCHAR(50) CHECK (risk_level IN ('low', 'moderate', 'high', 'unknown')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_prediction_type CHECK (
        prediction_type IN ('heart_disease', 'diabetes', 'brain_cancer', 'skin_cancer', 'symptoms')
    )
);

-- Create index for faster queries
CREATE INDEX predictions_user_id_idx ON public.predictions(user_id);
CREATE INDEX predictions_created_at_idx ON public.predictions(created_at);
CREATE INDEX predictions_type_idx ON public.predictions(prediction_type);

-- Enable Row Level Security
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own predictions"
    ON public.predictions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
    ON public.predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a function to get prediction counts by risk level
CREATE OR REPLACE FUNCTION get_prediction_stats(user_id UUID)
RETURNS TABLE (
    total_count BIGINT,
    low_risk_count BIGINT,
    moderate_risk_count BIGINT,
    high_risk_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE risk_level = 'low') AS low_risk_count,
        COUNT(*) FILTER (WHERE risk_level = 'moderate') AS moderate_risk_count,
        COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count
    FROM
        public.predictions
    WHERE
        predictions.user_id = get_prediction_stats.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
