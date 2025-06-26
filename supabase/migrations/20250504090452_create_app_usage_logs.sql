-- Create app_usage_logs table
CREATE TABLE IF NOT EXISTS public.app_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  pages_visited JSONB DEFAULT '[]'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS app_usage_logs_user_id_idx ON public.app_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS app_usage_logs_session_start_idx ON public.app_usage_logs(session_start);

-- Enable Row Level Security
ALTER TABLE public.app_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own app usage logs"
  ON public.app_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app usage logs"
  ON public.app_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app usage logs"
  ON public.app_usage_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
