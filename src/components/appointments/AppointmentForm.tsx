import { emailService } from '../../services/emailService';

const handleCreateAppointment = async (appointmentData: AppointmentData) => {
  try {
    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) throw error;

    // Get user and doctor details
    const { data: user } = await supabase
      .from('user_profiles_with_email')
      .select('*')
      .eq('id', appointmentData.user_id)
      .single();

    const { data: doctor } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', appointmentData.doctor_id)
      .single();

    if (!user || !doctor) throw new Error('User or doctor not found');

    // Send confirmation email
    await emailService.sendEmail({
      to: user.email,
      userName: user.full_name,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      appointmentDate: new Date(appointment.appointment_date),
      appointmentId: appointment.id,
      action: 'booked'
    });

    // Show success message
    toast.success('Appointment created successfully');
  } catch (error) {
    console.error('Error creating appointment:', error);
    toast.error('Failed to create appointment');
  }
};
