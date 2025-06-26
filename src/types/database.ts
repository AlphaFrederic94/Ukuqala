export interface EmailQueue {
  id: string;
  created_at: string;
  appointment_id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  email_type: 'confirmation' | 'cancellation' | 'reschedule';
  status: 'pending' | 'sent' | 'failed';
  to_email: string;
  error_message?: string;
  sent_at?: string;
}