-- Enable RLS on the tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Email queue policies
CREATE POLICY "Users can create email queue entries"
ON email_queue FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own email queue entries"
ON email_queue FOR SELECT
TO authenticated
USING (user_id = auth.uid());