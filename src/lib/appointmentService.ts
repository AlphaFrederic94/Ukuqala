import { supabase } from './supabaseClient';
import { emailService } from '../services/emailService';

interface AppointmentCreate {
  userId: string;
  doctorId: string;
  appointmentDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export const appointmentService = {
  createAppointment: async (appointment: AppointmentCreate) => {
    try {
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: appointment.userId,
          doctor_id: appointment.doctorId,
          appointment_date: appointment.appointmentDate,
          status: appointment.status,
          notes: appointment.notes
        }])
        .select()
        .single();

      if (error) throw error;

      // Get doctor and user info for email
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', appointment.doctorId)
        .single();

      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', appointment.userId)
        .single();

      // Queue confirmation email
      if (!newAppointment || !doctor || !user) {
        console.error('Missing data for email confirmation');
      } else {
        try {
          await emailService.sendAppointmentConfirmation(
            newAppointment,
            doctor,
            user
          );
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Continue with appointment creation even if email fails
        }
      }

      return newAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  getAppointments: async (userId: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors:doctor_id (*)
      `)
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data;
  }
};