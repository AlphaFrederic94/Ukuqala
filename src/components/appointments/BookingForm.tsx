import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { motion, AnimatePresence } from 'framer-motion';
import "react-datepicker/dist/react-datepicker.css";
import { DoctorCard } from '../DoctorCard';
import { supabase } from '../../lib/supabaseClient';

interface Education {
  university: string;
  degree: string;
  year: string;
  country: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image?: string;
  rating?: number;
  experience?: string;
  education?: Education[];
  bio?: string;
  location?: string;
  availability?: string[];
}

interface BookingFormProps {
  doctors: Doctor[];
  onClose: () => void;
  onSubmit: (data: {
    doctorId: string;
    appointmentDate: Date;
    notes: string;
    phoneNumber: string;
    countryCode: string;
  }) => void;
}

export const BookingForm = ({ doctors, onClose, onSubmit }: BookingFormProps) => {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
  const [step, setStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [noSlotsAvailable, setNoSlotsAvailable] = useState(false);

  // Enhanced doctor data with education information
  const enhancedDoctors = doctors.map(doctor => ({
    ...doctor,
    education: doctor.education || [
      {
        university: 'Harvard Medical School',
        degree: 'MD',
        year: '2015',
        country: 'USA'
      },
      {
        university: 'Oxford University',
        degree: 'BSc Medicine',
        year: '2011',
        country: 'UK'
      }
    ],
    experience: doctor.experience || '10',
    rating: doctor.rating || 4.9
  }));

  // Reasons to book an appointment
  const bookingReasons = [
    { title: 'Expert Specialists', description: 'Access to top-rated specialists from prestigious institutions worldwide' },
    { title: 'Personalized Care', description: 'Tailored treatment plans designed specifically for your health needs' },
    { title: 'Advanced Technology', description: 'State-of-the-art diagnostic and treatment technologies' },
    { title: 'Convenient Scheduling', description: 'Flexible appointment times to fit your busy schedule' }
  ];

  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      checkAvailability(selectedDoctor, appointmentDate);
    }
  }, [selectedDoctor, appointmentDate]);

  const checkAvailability = async (doctorId: string, date: Date) => {
    setIsCheckingAvailability(true);
    setNoSlotsAvailable(false);

    try {
      // Format date to get just the day part (YYYY-MM-DD)
      const dateString = date.toISOString().split('T')[0];

      // Check existing appointments for this doctor on this day
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', `${dateString}T00:00:00`)
        .lt('appointment_date', `${dateString}T23:59:59`)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Generate available time slots (9 AM to 5 PM, 1-hour intervals)
      const bookedTimes = data.map(a => new Date(a.appointment_date).getHours());
      const allSlots = [];

      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0); // Reset time part

      for (let hour = 9; hour <= 17; hour++) {
        if (!bookedTimes.includes(hour)) {
          const slotDate = new Date(selectedDate);
          slotDate.setHours(hour, 0, 0, 0);
          allSlots.push(slotDate);
        }
      }

      setAvailableSlots(allSlots);
      setNoSlotsAvailable(allSlots.length === 0);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableSlots([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !phoneNumber || !countryCode) return;

    onSubmit({
      doctorId: selectedDoctor,
      appointmentDate,
      notes,
      phoneNumber,
      countryCode
    });
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const selectedDoctorData = enhancedDoctors.find(d => d.id === selectedDoctor);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl relative mx-4 my-auto"
        >
          <motion.button
            whileHover={{ rotate: 90 }}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
          >
            <X className="h-6 w-6" />
          </motion.button>

          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl p-8 text-white">
            <h2 className="text-3xl font-bold">Book Your Appointment</h2>
            <p className="mt-2 opacity-90">Schedule a visit with our world-class medical specialists</p>
          </div>

          {/* Progress indicator */}
          <div className="px-8 pt-6">
            <div className="flex justify-between mb-8 relative">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}
                  >
                    {i}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${step >= i ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                    {i === 1 ? 'Select Doctor' : i === 2 ? 'Choose Date & Time' : 'Confirm Details'}
                  </span>
                </div>
              ))}
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(step - 1) * 50}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="px-8 pb-8">
            {step === 1 && (
              <div>
                {/* Why book with us section */}
                <div className="mb-8 bg-blue-50 dark:bg-gray-700/30 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-300">Why Book With Us?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookingReasons.map((reason, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{reason.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{reason.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-4 dark:text-white">Select a Specialist</h3>
                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {enhancedDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor.id)}
                      className="cursor-pointer"
                    >
                      <DoctorCard
                        doctor={doctor}
                        selected={selectedDoctor === doctor.id}
                        detailed={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                {selectedDoctorData && (
                  <div className="mb-6">
                    <DoctorCard doctor={selectedDoctorData} detailed={true} />
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4 dark:text-white">Select Date & Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment Date</label>
                      <DatePicker
                        selected={appointmentDate}
                        onChange={(date) => setAppointmentDate(date)}
                        dateFormat="MMMM d, yyyy"
                        minDate={new Date()}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2.5"
                        wrapperClassName="block w-full"
                        inline
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Time Slots</label>
                      {isCheckingAvailability ? (
                        <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : noSlotsAvailable ? (
                        <div className="flex flex-col justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">No Available Slots</h4>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">There are no available appointments on this date. Please select another date.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          {availableSlots.map((slot, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setAppointmentDate(slot)}
                              className={`p-3 rounded-lg text-center ${appointmentDate?.getTime() === slot.getTime()
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600'}`}
                            >
                              {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="bg-blue-50 dark:bg-gray-700/30 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Appointment Summary</h3>

                  <div className="space-y-4">
                    {selectedDoctorData && (
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Doctor</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedDoctorData.name} - {selectedDoctorData.specialty}
                          </p>
                        </div>
                      </div>
                    )}

                    {appointmentDate && (
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {appointmentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {appointmentDate && (
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Information for SMS Reminders
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Country Code
                        </label>
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        >
                          <option value="+234">Nigeria (+234)</option>
                          <option value="+233">Ghana (+233)</option>
                          <option value="+254">Kenya (+254)</option>
                          <option value="+27">South Africa (+27)</option>
                          <option value="+251">Ethiopia (+251)</option>
                          <option value="+20">Egypt (+20)</option>
                          <option value="+255">Tanzania (+255)</option>
                          <option value="+256">Uganda (+256)</option>
                          <option value="+237">Cameroon (+237)</option>
                          <option value="+225">Côte d'Ivoire (+225)</option>
                          <option value="+1">USA/Canada (+1)</option>
                          <option value="+44">UK (+44)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      You'll receive appointment confirmations and reminders via SMS
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={4}
                      placeholder="Any special requirements or health concerns you'd like the doctor to know about..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => step > 1 && setStep(step - 1)}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  step === 1
                    ? 'invisible'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                Previous
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type={step === 3 ? 'button' : 'button'}
                onClick={() => {
                  if (step === 3) {
                    handleSubmit(new Event('submit') as any);
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={
                  (step === 1 && !selectedDoctor) ||
                  (step === 2 && !appointmentDate) ||
                  (step === 3 && (!phoneNumber || phoneNumber.length < 5)) ||
                  isCheckingAvailability
                }
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isCheckingAvailability ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    Checking...
                  </span>
                ) : step === 3 ? (
                  'Confirm Appointment'
                ) : (
                  'Continue'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
