CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id),
  user_id uuid REFERENCES auth.users,
  doctor_id uuid NOT NULL,
  appointment_date timestamptz NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'reminder')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email queue"
  ON email_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);