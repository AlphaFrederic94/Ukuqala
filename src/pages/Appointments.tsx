import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Calendar, Loader2, CheckCircle, Clock, User, Shield, HeartPulse, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AppointmentCard } from '../components/appointments/AppointmentCard';
import { BookingForm } from '../components/appointments/BookingForm';
import { DoctorCard } from '../components/DoctorCard';
import { emailService } from '../services/emailService';
import { useToast } from '../components/ui/Toast';
import { notificationService } from '../services/notificationService';
import { smsService } from '../services/smsService';
import DatePicker from 'react-datepicker';
import { motion } from 'framer-motion';
import IllustrationImage from '../components/IllustrationImage';
import 'react-datepicker/dist/react-datepicker.css';

// Define the AppointmentData interface
interface AppointmentData {
  doctorId: string;
  appointmentDate: Date;
  notes: string;
  phoneNumber: string;
  countryCode: string;
}

export default function Appointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date());
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(true);
  const [maxVisibleAppointments, setMaxVisibleAppointments] = useState(3); // Number of appointments to show when collapsed

  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          notes,
          doctor:doctors(
            id,
            name,
            specialty,
            image,
            location
          )
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive"
      });
    }
  };

  const handleBookAppointment = async (data: AppointmentData) => {
    try {
      // Create appointment
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          doctor_id: data.doctorId,
          appointment_date: data.appointmentDate.toISOString(),
          status: 'pending',
          phone_number: data.phoneNumber,
          country_code: data.countryCode
        }])
        .select()
        .single();

      if (error) throw error;

      // Send email notification
      try {
        await emailService.sendAppointmentEmail({
          appointmentId: appointment.id,
          userId: user.id,
          doctorId: data.doctorId,
          appointmentDate: data.appointmentDate,
          action: 'booked'
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Show warning toast but don't block appointment creation
        toast({
          title: "Warning",
          description: "Appointment created but email notification failed",
          variant: "warning"
        });
      }

      // Send SMS confirmation
      try {
        await sendSMSConfirmation(
          appointment.id,
          `${data.countryCode}${data.phoneNumber}`,
          data.appointmentDate,
          doctors.find(d => d.id === data.doctorId)?.name || 'your doctor'
        );
      } catch (smsError) {
        console.error('Failed to send SMS confirmation:', smsError);
        // Show warning toast but don't block appointment creation
        toast({
          title: "Warning",
          description: "Appointment created but SMS confirmation failed",
          variant: "warning"
        });
      }

      toast({
        title: "Success",
        description: "Appointment booked successfully",
        variant: "success"
      });

      await fetchAppointments();
      setShowBookingForm(false);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive"
      });
    }
  };

  // Function to send SMS confirmation
  const sendSMSConfirmation = async (
    appointmentId: string,
    phoneNumber: string,
    appointmentDate: Date,
    doctorName: string
  ) => {
    try {
      return await smsService.sendAppointmentConfirmation(
        phoneNumber,
        doctorName,
        appointmentDate,
        appointmentId
      );
    } catch (error) {
      console.error('Error sending SMS confirmation:', error);
      throw error;
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // First get the appointment details to get the phone number
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          phone_number,
          country_code,
          appointment_date,
          doctor:doctors(
            id,
            name
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update the appointment
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Show in-app notification
      await notificationService.showNotification({
        title: 'Appointment Cancelled',
        body: 'Your appointment has been cancelled successfully',
        onClick: () => {
          window.focus();
          navigate('/appointments');
        }
      });

      // Send SMS notification if phone number is available
      if (appointmentData?.phone_number && appointmentData?.country_code) {
        try {
          await sendSMSCancellation(
            appointmentId,
            `${appointmentData.country_code}${appointmentData.phone_number}`,
            new Date(appointmentData.appointment_date),
            appointmentData.doctor?.name || 'your doctor'
          );
        } catch (smsError) {
          console.error('Failed to send SMS cancellation notification:', smsError);
          // Show warning toast but don't block cancellation
          toast({
            title: "Warning",
            description: "Appointment cancelled but SMS notification failed",
            variant: "warning"
          });
        }
      }

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  };

  // Function to send SMS cancellation notification
  const sendSMSCancellation = async (
    appointmentId: string,
    phoneNumber: string,
    appointmentDate: Date,
    doctorName: string
  ) => {
    try {
      return await smsService.sendAppointmentCancellation(
        phoneNumber,
        doctorName,
        appointmentDate,
        appointmentId
      );
    } catch (error) {
      console.error('Error sending SMS cancellation notification:', error);
      throw error;
    }
  };

  const handleRescheduleAppointment = async (appointmentId: string, newDate: Date) => {
    try {
      // First get the appointment details to get the phone number
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          phone_number,
          country_code,
          doctor:doctors(
            id,
            name
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update the appointment
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate.toISOString(),
          status: 'pending'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Show in-app notification
      await notificationService.showNotification({
        title: 'Appointment Rescheduled',
        body: `Your appointment has been rescheduled to ${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`,
        onClick: () => {
          window.focus();
          navigate('/appointments');
        }
      });

      // Send SMS notification if phone number is available
      if (appointmentData?.phone_number && appointmentData?.country_code) {
        try {
          await sendSMSReschedule(
            appointmentId,
            `${appointmentData.country_code}${appointmentData.phone_number}`,
            newDate,
            appointmentData.doctor?.name || 'your doctor'
          );
        } catch (smsError) {
          console.error('Failed to send SMS reschedule notification:', smsError);
          // Show warning toast but don't block rescheduling
          toast({
            title: "Warning",
            description: "Appointment rescheduled but SMS notification failed",
            variant: "warning"
          });
        }
      }

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive"
      });
    }
  };

  // Function to send SMS reschedule notification
  const sendSMSReschedule = async (
    appointmentId: string,
    phoneNumber: string,
    appointmentDate: Date,
    doctorName: string
  ) => {
    try {
      return await smsService.sendAppointmentReschedule(
        phoneNumber,
        doctorName,
        appointmentDate,
        appointmentId
      );
    } catch (error) {
      console.error('Error sending SMS reschedule notification:', error);
      throw error;
    }
  };

  const filterAppointments = (appointments, type: 'upcoming' | 'past') => {
    const now = new Date();
    const startOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
    const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0);

    return appointments.filter(app => {
      const appDate = new Date(app.appointment_date);
      const isInSelectedMonth = appDate >= startOfMonth && appDate <= endOfMonth;

      if (type === 'upcoming') {
        return appDate >= now && app.status !== 'cancelled' && isInSelectedMonth;
      }
      return (appDate < now || app.status === 'cancelled') && isInSelectedMonth;
    });
  };

  // Benefits of booking an appointment
  const appointmentBenefits = [
    {
      icon: <Shield className="w-10 h-10 text-blue-500" />,
      title: "Preventive Care",
      description: "Regular check-ups help detect health issues before they become serious."
    },
    {
      icon: <HeartPulse className="w-10 h-10 text-red-500" />,
      title: "Specialized Treatment",
      description: "Access to specialists trained at top medical institutions in the US, UK, and Japan."
    },
    {
      icon: <Stethoscope className="w-10 h-10 text-green-500" />,
      title: "Personalized Approach",
      description: "Customized healthcare plans tailored to your specific needs and medical history."
    },
    {
      icon: <Clock className="w-10 h-10 text-purple-500" />,
      title: "Timely Care",
      description: "Quick access to medical professionals when you need them most."
    }
  ];

  // Featured doctors with enhanced information
  const featuredDoctors = doctors.slice(0, 3).map(doctor => ({
    ...doctor,
    education: [
      {
        university: ['Harvard Medical School', 'Johns Hopkins University', 'Stanford University', 'Mayo Clinic', 'Oxford University', 'University of Tokyo', 'Cambridge University'][Math.floor(Math.random() * 7)],
        degree: ['MD', 'PhD', 'MBBS', 'MS', 'MPH'][Math.floor(Math.random() * 5)],
        year: String(2000 + Math.floor(Math.random() * 20)),
        country: ['USA', 'UK', 'Japan'][Math.floor(Math.random() * 3)]
      },
      {
        university: ['Yale University', 'UCLA Medical Center', 'Imperial College London', 'Kyoto University', 'University of Pennsylvania'][Math.floor(Math.random() * 5)],
        degree: ['BSc', 'MSc', 'Fellowship', 'Residency'][Math.floor(Math.random() * 4)],
        year: String(1995 + Math.floor(Math.random() * 15)),
        country: ['USA', 'UK', 'Japan'][Math.floor(Math.random() * 3)]
      }
    ],
    experience: String(5 + Math.floor(Math.random() * 20)),
    rating: 4.5 + (Math.random() * 0.5)
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="md:max-w-xl mb-8 md:mb-0">
            <h1 className="text-4xl font-bold mb-4">Your Health, Our Priority</h1>
            <p className="text-xl opacity-90 mb-6">Schedule appointments with world-class specialists from prestigious medical institutions.</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBookingForm(true)}
              className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg shadow-lg bg-white text-blue-700 hover:bg-blue-50 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Book an Appointment
            </motion.button>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <IllustrationImage
              name="appointments"
              alt="Online Doctor Consultation"
              className="max-w-full h-auto transform hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Why Book an Appointment?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {appointmentBenefits.map((benefit, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{benefit.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured doctors section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Our Featured Specialists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredDoctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              whileHover={{ y: -5 }}
              className="cursor-pointer"
              onClick={() => {
                setShowBookingForm(true);
                // Pre-select this doctor when opening the booking form
                setTimeout(() => {
                  const doctorSelect = document.querySelector('select[name="doctor"]');
                  if (doctorSelect) {
                    (doctorSelect as HTMLSelectElement).value = doctor.id;
                  }
                }, 100);
              }}
            >
              <DoctorCard doctor={doctor} detailed={true} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* My appointments section */}
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Appointments</h2>

        <div className="flex items-center space-x-4">
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            className="px-4 py-2 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBookingForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Appointment
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center cursor-pointer"
                 onClick={() => setUpcomingExpanded(!upcomingExpanded)}>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-white">Upcoming Appointments</h3>
                {filterAppointments(appointments, 'upcoming').length > 0 && (
                  <span className="ml-2 bg-white text-blue-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {filterAppointments(appointments, 'upcoming').length}
                  </span>
                )}
              </div>
              <motion.div
                animate={{ rotate: upcomingExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {!upcomingExpanded && filterAppointments(appointments, 'upcoming').length > 0 && (
              <div className="px-6 py-3 border-t border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-between">
                <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Next: {new Date(filterAppointments(appointments, 'upcoming')[0].appointment_date).toLocaleDateString()} with Dr. {filterAppointments(appointments, 'upcoming')[0].doctor.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUpcomingExpanded(true);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  View all <ChevronDown className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}

            <motion.div
              className="overflow-hidden"
              animate={{ height: upcomingExpanded ? 'auto' : '0px' }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filterAppointments(appointments, 'upcoming').length > 0 ? (
                      <>
                        {filterAppointments(appointments, 'upcoming')
                          .slice(0, upcomingExpanded ? undefined : maxVisibleAppointments)
                          .map((appointment) => (
                            <AppointmentCard
                              key={appointment.id}
                              appointment={appointment}
                              onCancel={handleCancelAppointment}
                              onReschedule={handleRescheduleAppointment}
                            />
                          ))}

                        {!upcomingExpanded && filterAppointments(appointments, 'upcoming').length > maxVisibleAppointments && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpcomingExpanded(true);
                            }}
                            className="w-full py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg flex items-center justify-center font-medium"
                          >
                            <span>Show {filterAppointments(appointments, 'upcoming').length - maxVisibleAppointments} more</span>
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </motion.button>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4">
                          <IllustrationImage
                            name="empty-state"
                            alt="No Upcoming Appointments"
                            className="h-32"
                          />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Upcoming Appointments</h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have any upcoming appointments scheduled.</p>
                        <button
                          onClick={() => setShowBookingForm(true)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Book Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Past & Cancelled Appointments */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4 flex justify-between items-center cursor-pointer"
                 onClick={() => setPastExpanded(!pastExpanded)}>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-white">Past & Cancelled</h3>
                {filterAppointments(appointments, 'past').length > 0 && (
                  <span className="ml-2 bg-white text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {filterAppointments(appointments, 'past').length}
                  </span>
                )}
              </div>
              <motion.div
                animate={{ rotate: pastExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {!pastExpanded && filterAppointments(appointments, 'past').length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Last: {new Date(filterAppointments(appointments, 'past')[0].appointment_date).toLocaleDateString()} with Dr. {filterAppointments(appointments, 'past')[0].doctor.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPastExpanded(true);
                  }}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline flex items-center"
                >
                  View all <ChevronDown className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}

            <motion.div
              className="overflow-hidden"
              animate={{ height: pastExpanded ? 'auto' : '0px' }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filterAppointments(appointments, 'past').length > 0 ? (
                      <>
                        {filterAppointments(appointments, 'past')
                          .slice(0, pastExpanded ? undefined : maxVisibleAppointments)
                          .map((appointment) => (
                            <AppointmentCard
                              key={appointment.id}
                              appointment={appointment}
                              onCancel={handleCancelAppointment}
                              onReschedule={handleRescheduleAppointment}
                            />
                          ))}

                        {!pastExpanded && filterAppointments(appointments, 'past').length > maxVisibleAppointments && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPastExpanded(true);
                            }}
                            className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center font-medium"
                          >
                            <span>Show {filterAppointments(appointments, 'past').length - maxVisibleAppointments} more</span>
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </motion.button>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Past Appointments</h4>
                        <p className="text-gray-500 dark:text-gray-400">Your past appointment history will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {showBookingForm && (
        <BookingForm
          doctors={doctors}
          onClose={() => setShowBookingForm(false)}
          onSubmit={handleBookAppointment}
        />
      )}
    </div>
  );
}
