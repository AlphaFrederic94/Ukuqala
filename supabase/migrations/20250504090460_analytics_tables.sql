-- Create tables for analytics
CREATE TABLE IF NOT EXISTS weight_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  weight decimal(5,2) NOT NULL,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  activity_type text NOT NULL,
  duration integer NOT NULL,
  calories_burned integer,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  duration decimal(4,2) NOT NULL,
  quality integer CHECK (quality >= 1 AND quality <= 5),
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE weight_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own weight measurements"
  ON weight_measurements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own activity logs"
  ON activity_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sleep logs"
  ON sleep_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own metrics"
  ON user_metrics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
