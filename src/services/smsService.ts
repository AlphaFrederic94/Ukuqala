import { db } from '../lib/firebaseConfig';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Define message types
export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

// SMS Service
export const smsService = {
  /**
   * Send an SMS message
   * @param message The SMS message to send
   * @returns Promise that resolves when the message is sent
   */
  async sendSMS(message: SMSMessage): Promise<any> {
    try {
      console.log('Sending SMS:', message);

      // Store the message in Firestore for tracking
      const messageRef = await db.collection('sms_messages').add({
        to: message.to,
        body: message.body,
        from: message.from || 'CareAI',
        status: 'pending',
        createdAt: new Date()
      });

      try {
        // Call the Cloud Function to send the SMS via Africa's Talking
        const functions = getFunctions(getApp());
        const sendSMSFunction = httpsCallable(functions, 'sendSMS');

        console.log('Calling Firebase Cloud Function sendSMS with:', message);
        const result = await sendSMSFunction(message);
        console.log('Cloud Function result:', result.data);

        // Update the message status
        await messageRef.update({
          status: 'sent',
          providerResponse: result.data
        });

        return result.data;
      } catch (functionError) {
        // If the Cloud Function fails or isn't deployed, log it but don't fail
        console.error('Error calling Cloud Function:', functionError);

        // For development/testing, we'll just simulate success
        // In production, you would integrate with an SMS API directly here as a fallback

        // Update the message status to simulate success
        await messageRef.update({
          status: 'sent_simulated',
          error: functionError.message || 'Unknown error'
        });

        // Show a more detailed error message in the console
        if (functionError.code === 'functions/not-found') {
          console.warn('The Cloud Function "sendSMS" is not deployed yet. Deploy it with: firebase deploy --only functions');
        } else if (functionError.code === 'functions/unauthenticated') {
          console.warn('Authentication required to call the Cloud Function. Make sure the user is logged in.');
        } else if (functionError.code === 'functions/internal') {
          console.error('Internal error in the Cloud Function:', functionError.details);
        }

        return {
          success: false,
          simulated: true,
          message: 'SMS simulated for development (Cloud Function not available)',
          messageId: messageRef.id,
          error: functionError.message || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  },

  /**
   * Send an appointment confirmation SMS
   * @param phoneNumber The recipient's phone number with country code
   * @param doctorName The doctor's name
   * @param appointmentDate The appointment date and time
   * @param appointmentId The appointment ID
   * @returns Promise that resolves when the message is sent
   */
  async sendAppointmentConfirmation(
    phoneNumber: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentId: string
  ): Promise<any> {
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const message = `CareAI: Your appointment with Dr. ${doctorName} is confirmed for ${formattedDate} at ${formattedTime}. Appointment ID: ${appointmentId.substring(0, 8)}`;

    return this.sendSMS({
      to: phoneNumber,
      body: message
    });
  },

  /**
   * Send an appointment reminder SMS
   * @param phoneNumber The recipient's phone number with country code
   * @param doctorName The doctor's name
   * @param appointmentDate The appointment date and time
   * @param appointmentId The appointment ID
   * @returns Promise that resolves when the message is sent
   */
  async sendAppointmentReminder(
    phoneNumber: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentId: string
  ): Promise<any> {
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const message = `CareAI Reminder: Your appointment with Dr. ${doctorName} is tomorrow at ${formattedTime}. Appointment ID: ${appointmentId.substring(0, 8)}`;

    return this.sendSMS({
      to: phoneNumber,
      body: message
    });
  },

  /**
   * Send an appointment cancellation SMS
   * @param phoneNumber The recipient's phone number with country code
   * @param doctorName The doctor's name
   * @param appointmentDate The appointment date and time
   * @param appointmentId The appointment ID
   * @returns Promise that resolves when the message is sent
   */
  async sendAppointmentCancellation(
    phoneNumber: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentId: string
  ): Promise<any> {
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const message = `CareAI: Your appointment with Dr. ${doctorName} scheduled for ${formattedDate} at ${formattedTime} has been cancelled. Appointment ID: ${appointmentId.substring(0, 8)}`;

    return this.sendSMS({
      to: phoneNumber,
      body: message
    });
  },

  /**
   * Send an appointment reschedule SMS
   * @param phoneNumber The recipient's phone number with country code
   * @param doctorName The doctor's name
   * @param appointmentDate The new appointment date and time
   * @param appointmentId The appointment ID
   * @returns Promise that resolves when the message is sent
   */
  async sendAppointmentReschedule(
    phoneNumber: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentId: string
  ): Promise<any> {
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const message = `CareAI: Your appointment with Dr. ${doctorName} has been rescheduled to ${formattedDate} at ${formattedTime}. Appointment ID: ${appointmentId.substring(0, 8)}`;

    return this.sendSMS({
      to: phoneNumber,
      body: message
    });
  }
};

export default smsService;
