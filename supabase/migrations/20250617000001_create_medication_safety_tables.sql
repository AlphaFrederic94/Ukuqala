-- Create medication safety monitoring tables

-- Medication profiles table
CREATE TABLE IF NOT EXISTS public.medication_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    allergies TEXT[] DEFAULT '{}',
    conditions TEXT[] DEFAULT '{}',
    last_monitored TIMESTAMP WITH TIME ZONE DEFAULT now(),
    risk_score INTEGER DEFAULT 0,
    monitoring_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Safety alerts table
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('recall', 'adverse_event', 'interaction', 'contraindication')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    medication TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_required TEXT NOT NULL,
    fda_source TEXT,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date_expires TIMESTAMP WITH TIME ZONE,
    acknowledged BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Monitoring settings table
CREATE TABLE IF NOT EXISTS public.monitoring_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    check_interval INTEGER DEFAULT 24, -- hours
    alert_threshold TEXT DEFAULT 'medium' CHECK (alert_threshold IN ('low', 'medium', 'high')),
    notification_methods TEXT[] DEFAULT '{"push"}',
    auto_acknowledge_recalls BOOLEAN DEFAULT false,
    include_minor_adverse_events BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Medication history table for tracking changes
CREATE TABLE IF NOT EXISTS public.medication_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('added', 'removed', 'modified')),
    previous_data JSONB,
    new_data JSONB,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Safety check logs table
CREATE TABLE IF NOT EXISTS public.safety_check_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL CHECK (check_type IN ('scheduled', 'manual', 'medication_change')),
    medications_checked TEXT[] NOT NULL,
    alerts_generated INTEGER DEFAULT 0,
    risk_score INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- FDA data cache table for performance
CREATE TABLE IF NOT EXISTS public.fda_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_profiles_user_id ON public.medication_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_profiles_last_monitored ON public.medication_profiles(last_monitored);

CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_severity ON public.safety_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_type ON public.safety_alerts(type);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_dismissed ON public.safety_alerts(dismissed);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_date_created ON public.safety_alerts(date_created);

CREATE INDEX IF NOT EXISTS idx_monitoring_settings_user_id ON public.monitoring_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_medication_history_user_id ON public.medication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_history_medication ON public.medication_history(medication_name);
CREATE INDEX IF NOT EXISTS idx_medication_history_created_at ON public.medication_history(created_at);

CREATE INDEX IF NOT EXISTS idx_safety_check_logs_user_id ON public.safety_check_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_check_logs_created_at ON public.safety_check_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_fda_data_cache_key ON public.fda_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_fda_data_cache_expires ON public.fda_data_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE public.medication_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_check_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fda_data_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Medication profiles policies
CREATE POLICY "Users can view their own medication profile" ON public.medication_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication profile" ON public.medication_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication profile" ON public.medication_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication profile" ON public.medication_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Safety alerts policies
CREATE POLICY "Users can view their own safety alerts" ON public.safety_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert safety alerts for users" ON public.safety_alerts
    FOR INSERT WITH CHECK (true); -- Allow system to create alerts

CREATE POLICY "Users can update their own safety alerts" ON public.safety_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own safety alerts" ON public.safety_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Monitoring settings policies
CREATE POLICY "Users can view their own monitoring settings" ON public.monitoring_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitoring settings" ON public.monitoring_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring settings" ON public.monitoring_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Medication history policies
CREATE POLICY "Users can view their own medication history" ON public.medication_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert medication history" ON public.medication_history
    FOR INSERT WITH CHECK (true);

-- Safety check logs policies
CREATE POLICY "Users can view their own safety check logs" ON public.safety_check_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert safety check logs" ON public.safety_check_logs
    FOR INSERT WITH CHECK (true);

-- FDA data cache policies (system-wide cache)
CREATE POLICY "Anyone can read FDA cache" ON public.fda_data_cache
    FOR SELECT USING (true);

CREATE POLICY "System can manage FDA cache" ON public.fda_data_cache
    FOR ALL USING (true);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_medication_profiles_updated_at 
    BEFORE UPDATE ON public.medication_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_settings_updated_at 
    BEFORE UPDATE ON public.monitoring_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log medication changes
CREATE OR REPLACE FUNCTION log_medication_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Check if medications array changed
        IF OLD.medications IS DISTINCT FROM NEW.medications THEN
            INSERT INTO public.medication_history (user_id, medication_name, action, previous_data, new_data, reason)
            VALUES (NEW.user_id, 'medication_list', 'modified', OLD.medications, NEW.medications, 'Profile updated');
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for medication change logging
CREATE TRIGGER log_medication_profile_changes
    AFTER UPDATE ON public.medication_profiles
    FOR EACH ROW EXECUTE FUNCTION log_medication_change();

-- Create function to automatically acknowledge expired alerts
CREATE OR REPLACE FUNCTION auto_acknowledge_expired_alerts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.safety_alerts 
    SET acknowledged = true, acknowledged_at = now()
    WHERE date_expires < now() AND acknowledged = false AND dismissed = false;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to run daily cleanup
-- Note: This would typically be run as a scheduled job, but we'll create the function for manual execution
CREATE OR REPLACE FUNCTION cleanup_expired_alerts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.safety_alerts 
    SET acknowledged = true, acknowledged_at = now()
    WHERE date_expires < now() AND acknowledged = false AND dismissed = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Clean up old FDA cache entries
    DELETE FROM public.fda_data_cache WHERE expires_at < now();
    
    RETURN updated_count;
END;
$$ language 'plpgsql';

-- Create function to get user risk summary
CREATE OR REPLACE FUNCTION get_user_risk_summary(p_user_id UUID)
RETURNS TABLE (
    total_medications INTEGER,
    risk_score INTEGER,
    active_alerts INTEGER,
    critical_alerts INTEGER,
    last_check TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(jsonb_array_length(mp.medications), 0)::INTEGER as total_medications,
        COALESCE(mp.risk_score, 0) as risk_score,
        COALESCE(alert_counts.active_alerts, 0)::INTEGER as active_alerts,
        COALESCE(alert_counts.critical_alerts, 0)::INTEGER as critical_alerts,
        mp.last_monitored as last_check
    FROM public.medication_profiles mp
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) FILTER (WHERE dismissed = false) as active_alerts,
            COUNT(*) FILTER (WHERE dismissed = false AND severity = 'critical') as critical_alerts
        FROM public.safety_alerts
        WHERE user_id = p_user_id
        GROUP BY user_id
    ) alert_counts ON mp.user_id = alert_counts.user_id
    WHERE mp.user_id = p_user_id;
END;
$$ language 'plpgsql';

-- Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    methods TEXT[] DEFAULT '{"browser"}',
    severity TEXT[] DEFAULT '{"medium","high","critical"}',
    quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00"}'::jsonb,
    frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Safety notifications table
CREATE TABLE IF NOT EXISTS public.safety_notifications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('recall', 'adverse_event', 'interaction', 'safety_update')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    medication TEXT NOT NULL,
    action_required TEXT NOT NULL,
    fda_source TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    delivery_methods TEXT[] DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for notification tables
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled ON public.notification_settings(enabled);

CREATE INDEX IF NOT EXISTS idx_safety_notifications_user_id ON public.safety_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_notifications_timestamp ON public.safety_notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_safety_notifications_read ON public.safety_notifications(read);
CREATE INDEX IF NOT EXISTS idx_safety_notifications_dismissed ON public.safety_notifications(dismissed);
CREATE INDEX IF NOT EXISTS idx_safety_notifications_severity ON public.safety_notifications(severity);

-- Enable RLS for notification tables
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_notifications ENABLE ROW LEVEL SECURITY;

-- Notification settings policies
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Safety notifications policies
CREATE POLICY "Users can view their own notifications" ON public.safety_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications for users" ON public.safety_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.safety_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.safety_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for notification settings updated_at
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically mark notifications as read when dismissed
CREATE OR REPLACE FUNCTION auto_mark_read_on_dismiss()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dismissed = true AND OLD.dismissed = false THEN
        NEW.read = true;
        NEW.read_at = now();
        NEW.dismissed_at = now();
    ELSIF NEW.read = true AND OLD.read = false THEN
        NEW.read_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-marking notifications
CREATE TRIGGER auto_mark_notifications_read
    BEFORE UPDATE ON public.safety_notifications
    FOR EACH ROW EXECUTE FUNCTION auto_mark_read_on_dismiss();

-- Create function to get user notification summary
CREATE OR REPLACE FUNCTION get_user_notification_summary(p_user_id UUID)
RETURNS TABLE (
    total_notifications INTEGER,
    unread_notifications INTEGER,
    critical_notifications INTEGER,
    recent_notifications INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_notifications,
        COUNT(*) FILTER (WHERE read = false)::INTEGER as unread_notifications,
        COUNT(*) FILTER (WHERE severity = 'critical' AND dismissed = false)::INTEGER as critical_notifications,
        COUNT(*) FILTER (WHERE timestamp > now() - interval '24 hours')::INTEGER as recent_notifications
    FROM public.safety_notifications
    WHERE user_id = p_user_id AND dismissed = false;
END;
$$ language 'plpgsql';

-- Create function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete notifications older than 90 days that are read and dismissed
    DELETE FROM public.safety_notifications
    WHERE timestamp < now() - interval '90 days'
    AND read = true
    AND dismissed = true;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Medication verifications table
CREATE TABLE IF NOT EXISTS public.medication_verifications (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    input_name TEXT NOT NULL,
    verified_name TEXT NOT NULL,
    ndc TEXT,
    confidence DECIMAL(3,2) DEFAULT 0.0,
    status TEXT NOT NULL CHECK (status IN ('verified', 'partial_match', 'multiple_matches', 'not_found')),
    matches_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for medication verifications
CREATE INDEX IF NOT EXISTS idx_medication_verifications_user_id ON public.medication_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_verifications_status ON public.medication_verifications(status);
CREATE INDEX IF NOT EXISTS idx_medication_verifications_created_at ON public.medication_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_medication_verifications_input_name ON public.medication_verifications(input_name);

-- Enable RLS for medication verifications
ALTER TABLE public.medication_verifications ENABLE ROW LEVEL SECURITY;

-- Medication verifications policies
CREATE POLICY "Users can view their own medication verifications" ON public.medication_verifications
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert medication verifications" ON public.medication_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own medication verifications" ON public.medication_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to get verification statistics
CREATE OR REPLACE FUNCTION get_verification_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_verifications INTEGER,
    verified_count INTEGER,
    partial_match_count INTEGER,
    not_found_count INTEGER,
    average_confidence DECIMAL(3,2),
    recent_verifications INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_verifications,
        COUNT(*) FILTER (WHERE status = 'verified')::INTEGER as verified_count,
        COUNT(*) FILTER (WHERE status = 'partial_match')::INTEGER as partial_match_count,
        COUNT(*) FILTER (WHERE status = 'not_found')::INTEGER as not_found_count,
        AVG(confidence)::DECIMAL(3,2) as average_confidence,
        COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::INTEGER as recent_verifications
    FROM public.medication_verifications
    WHERE (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
