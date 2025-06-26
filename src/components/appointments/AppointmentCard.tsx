import { format } from 'date-fns';
import { Calendar, Clock, MapPin, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointment_date: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    doctor: {
      id: string;
      name: string;
      specialty: string;
      address: string;
      image: string;
    };
  };
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  onReschedule,
}) => {
  if (!appointment.doctor) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      confirmed: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      cancelled: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      completed: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    };
    return colors[status] || colors.pending;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative overflow-hidden rounded-xl p-6 shadow-lg ${getStatusColor(appointment.status)}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid)"/>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={appointment.doctor.image}
              alt={appointment.doctor.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
            />
            <div className="ml-4">
              <h3 className="font-semibold text-lg text-white">{appointment.doctor.name}</h3>
              <p className="text-white/80">{appointment.doctor.specialty}</p>
            </div>
          </div>
          <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full text-white">
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
        </div>
        
        <div className="mt-6 space-y-3">
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex items-center text-white/90"
          >
            <Calendar className="w-5 h-5 mr-3 text-white" />
            <span>{format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex items-center text-white/90"
          >
            <Clock className="w-5 h-5 mr-3 text-white" />
            <span>{format(new Date(appointment.appointment_date), 'h:mm a')}</span>
          </motion.div>
          
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex items-center text-white/90"
          >
            <MapPin className="w-5 h-5 mr-3 text-white" />
            <span>{appointment.doctor.address}</span>
          </motion.div>
        </div>

        {appointment.status === 'pending' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onReschedule(appointment.id)}
              className="flex-1 px-4 py-2 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 text-white"
            >
              Reschedule
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCancel(appointment.id)}
              className="flex-1 px-4 py-2 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 text-white"
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
