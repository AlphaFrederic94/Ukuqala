-- Create water_logs table
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create water_reminders table
CREATE TABLE IF NOT EXISTS public.water_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_daily_ml INTEGER NOT NULL DEFAULT 2000,
    reminder_intervals INTEGER[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for better query performance
CREATE INDEX water_logs_user_id_logged_at_idx ON public.water_logs(user_id, logged_at);
CREATE INDEX water_reminders_user_id_idx ON public.water_reminders(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for water_logs
CREATE POLICY "Users can view their own water logs"
    ON public.water_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs"
    ON public.water_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for water_reminders
CREATE POLICY "Users can view their own water reminders"
    ON public.water_reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own water reminders"
    ON public.water_reminders FOR ALL
    USING (auth.uid() = user_id);