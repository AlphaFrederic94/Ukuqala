interface EmailTemplateData {
  userName: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: Date;
  appointmentId: string;
  action?: 'booked' | 'cancelled' | 'rescheduled';
}

export const emailTemplateService = {
  getEmailTemplate(type: string, data: EmailTemplateData) {
    const formattedDate = new Date(data.appointmentDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const templates = {
      confirmation: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Appointment Confirmation</h2>
          <p>Dear ${data.userName},</p>
          <p>Your appointment has been successfully booked with:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 5px 0;"><strong>Specialty:</strong> ${data.doctorSpecialty}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled appointment time.</p>
          <p>If you need to reschedule or cancel your appointment, please do so at least 24 hours in advance.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 0.875rem;">This is an automated message, please do not reply.</p>
        </div>
      `,

      cancellation: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Appointment Cancellation</h2>
          <p>Dear ${data.userName},</p>
          <p>Your appointment has been cancelled:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 5px 0;"><strong>Originally Scheduled for:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          </div>
          <p>If you would like to schedule a new appointment, please visit our website.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 0.875rem;">This is an automated message, please do not reply.</p>
        </div>
      `,

      reschedule: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Appointment Rescheduled</h2>
          <p>Dear ${data.userName},</p>
          <p>Your appointment has been successfully rescheduled to:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 5px 0;"><strong>Specialty:</strong> ${data.doctorSpecialty}</p>
            <p style="margin: 5px 0;"><strong>New Date & Time:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled appointment time.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 0.875rem;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    return templates[type] || templates.confirmation;
  }
};