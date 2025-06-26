import { emailTemplateService } from './emailTemplateService';
import { supabase } from '../lib/supabaseClient';

interface SendEmailParams {
  to: string;
  userName: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: Date;
  appointmentId: string;
  action?: 'booked' | 'cancelled' | 'rescheduled';
}

interface AppointmentEmailParams {
  appointmentId: string;
  userId: string;
  doctorId: string;
  appointmentDate: Date;
  action: 'booked' | 'cancelled' | 'rescheduled';
}

// For compatibility with appointmentService.ts
interface AppointmentData {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  status: string;
  notes?: string;
  created_at?: string;
}

interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  [key: string]: any;
}

interface UserData {
  id: string;
  full_name: string;
  email: string;
  [key: string]: any;
}

export const emailService = {
  async sendEmail(params: SendEmailParams) {
    try {
      const emailType = params.action === 'cancelled' ? 'cancellation' :
                       params.action === 'rescheduled' ? 'reschedule' :
                       'confirmation';

      const htmlContent = emailTemplateService.getEmailTemplate(emailType, {
        userName: params.userName,
        doctorName: params.doctorName,
        doctorSpecialty: params.doctorSpecialty,
        appointmentDate: params.appointmentDate,
        appointmentId: params.appointmentId,
        action: params.action
      });

      // Use the Edge Function URL from environment variables
      const response = await fetch(import.meta.env.VITE_EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.to,
          subject: `Appointment ${params.action || 'Update'}`,
          htmlContent
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Response text:', text);
        throw new Error(`Invalid response from server: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  async sendAppointmentEmail(params: AppointmentEmailParams) {
    try {
      const { data: user, error: userError } = await supabase
        .from('user_profiles_with_email')
        .select('*')
        .eq('id', params.userId)
        .single();

      if (userError) throw new Error(`Failed to fetch user: ${userError.message}`);

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', params.doctorId)
        .single();

      if (doctorError) throw new Error(`Failed to fetch doctor: ${doctorError.message}`);

      if (!user || !doctor) {
        throw new Error('User or doctor not found');
      }

      return await this.sendEmail({
        to: user.email,
        userName: user.full_name,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        appointmentDate: params.appointmentDate,
        appointmentId: params.appointmentId,
        action: params.action
      });
    } catch (error: any) {
      console.error('Error sending appointment email:', error);
      throw error;
    }
  },

  // Add the missing sendAppointmentConfirmation method to fix the integration with appointmentService.ts
  async sendAppointmentConfirmation(appointment: AppointmentData, doctor: DoctorData, user: UserData) {
    try {
      if (!appointment || !doctor || !user) {
        throw new Error('Missing required data for appointment confirmation');
      }

      // Convert string date to Date object
      const appointmentDate = new Date(appointment.appointment_date);

      return await this.sendEmail({
        to: user.email,
        userName: user.full_name,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        appointmentDate: appointmentDate,
        appointmentId: appointment.id,
        action: 'booked'
      });
    } catch (error: any) {
      console.error('Error sending appointment confirmation:', error);
      throw new Error(`Failed to send appointment confirmation: ${error.message}`);
    }
  }
};
