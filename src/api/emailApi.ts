import { supabase } from '../lib/supabaseClient';
import { emailTemplateService } from '../services/emailTemplateService';

interface SendEmailParams {
  appointmentId: string;
  userId: string;
  doctorId: string;
  appointmentDate: string;
  userEmail: string;
}

export const emailApi = {
  sendAppointmentConfirmation: async (params: SendEmailParams) => {
    try {
      // Insert into email queue
      const { data, error } = await supabase
        .from('email_queue')
        .insert([{
          appointment_id: params.appointmentId,
          user_id: params.userId,
          doctor_id: params.doctorId,
          appointment_date: params.appointmentDate,
          email_type: 'confirmation',
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Get doctor and user info for email template
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', params.doctorId)
        .single();

      if (doctorError) throw doctorError;

      const { data: user, error: userError } = await supabase
        .from('user_profiles_with_email')
        .select('*')
        .eq('id', params.userId)
        .single();

      if (userError) throw userError;

      // Generate email content
      const appointmentDate = new Date(params.appointmentDate);
      const htmlContent = emailTemplateService.getEmailTemplate('confirmation', {
        userName: user.full_name,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        appointmentDate: appointmentDate,
        appointmentId: params.appointmentId,
        action: 'booked'
      });

      // Trigger email sending via backend API
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.userEmail,
          subject: 'Appointment Confirmation',
          htmlContent: htmlContent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }
  }
};
