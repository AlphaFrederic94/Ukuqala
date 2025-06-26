import { notificationService } from './notificationService';
import { smsService } from './smsService';
import { supabase } from '../lib/supabaseClient';

export const appointmentReminderService = {
  async checkUpcomingAppointments(userId: string) {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          phone_number,
          country_code,
          doctors (
            id,
            name,
            specialty
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', tomorrow.toISOString());

      if (error) throw error;

      for (const appointment of appointments || []) {
        const appointmentDate = new Date(appointment.appointment_date);
        const timeUntilAppointment = appointmentDate.getTime() - now.getTime();

        // Set reminder for 1 hour before appointment
        setTimeout(() => {
          // Send in-app notification
          notificationService.showNotification({
            title: 'Upcoming Appointment Reminder',
            body: `You have an appointment with Dr. ${appointment.doctors.name} (${appointment.doctors.specialty}) in 1 hour`,
            onClick: () => {
              window.focus();
              window.location.href = '/appointments';
            }
          });

          // Send SMS reminder if phone number is available
          if (appointment.phone_number && appointment.country_code) {
            this.sendSMSReminder(appointment);
          }
        }, timeUntilAppointment - 60 * 60 * 1000); // 1 hour before
      }
    } catch (error) {
      console.error('Error checking upcoming appointments:', error);
    }
  },

  async sendSMSReminder(appointment: any) {
    try {
      if (!appointment.phone_number || !appointment.country_code) {
        console.log('No phone number available for SMS reminder');
        return false;
      }

      const appointmentDate = new Date(appointment.appointment_date);
      const doctorName = appointment.doctors?.name || 'your doctor';

      await smsService.sendAppointmentReminder(
        `${appointment.country_code}${appointment.phone_number}`,
        doctorName,
        appointmentDate,
        appointment.id
      );

      console.log(`Sent SMS reminder for appointment ${appointment.id}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS reminder:', error);
      return false;
    }
  },

  startReminderCheck(userId: string) {
    // Check immediately
    this.checkUpcomingAppointments(userId);

    // Then check every hour
    setInterval(() => {
      this.checkUpcomingAppointments(userId);
    }, 60 * 60 * 1000); // Every hour
  }
};