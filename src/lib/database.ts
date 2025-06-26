import { supabase } from './supabaseClient';

const DEFAULT_DOCTOR_IMAGE = '/images/default_user.jpg';

export const dbApi = {
  // Appointments
  getAppointments: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors:doctor_id (
            id,
            name,
            specialty,
            image
          )
        `)
        .eq('user_id', userId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getAppointments:', error);
      throw error;
    }
  },

  getDoctors: async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (error) throw error;
      
      if (!data) return [];

      return data.map(doctor => ({
        ...doctor,
        image: DEFAULT_DOCTOR_IMAGE,
        availability: parseAvailability(doctor.availability)
      }));
    } catch (error) {
      console.error('Error getting doctors:', error);
      return [];
    }
  },

  createAppointment: async (appointmentData) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: appointmentData.userId,
          doctor_id: appointmentData.doctorId,
          appointment_date: appointmentData.appointmentDate,
          status: appointmentData.status,
          notes: appointmentData.notes
        }])
        .select('*, doctors(*)')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createAppointment:', error);
      throw error;
    }
  },

  updateAppointment: async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: updates.status,
          notes: updates.notes,
          email_sent: updates.emailSent
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return false;
    }
  }
};

// Helper function to parse availability data
function parseAvailability(availability: any): string[] {
  if (!availability) return [];
  
  try {
    // If it's already an array, return it
    if (Array.isArray(availability)) return availability;
    
    // If it's a JSON string, parse it
    if (typeof availability === 'string') {
      // Try parsing as JSON first
      try {
        return JSON.parse(availability);
      } catch {
        // If JSON parsing fails, split by comma
        return availability.split(',').map(day => day.trim());
      }
    }
    
    // If it's an object (from Supabase JSONB), convert to array
    if (typeof availability === 'object') {
      return Object.values(availability);
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing availability:', error);
    return [];
  }
}
