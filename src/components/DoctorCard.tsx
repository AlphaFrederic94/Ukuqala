import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Award, BookOpen, Calendar } from 'lucide-react';

interface Education {
  university: string;
  degree: string;
  year: string;
  country: string;
}

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    image: string;
    rating?: number;
    experience?: string;
    education?: Education[];
    bio?: string;
    location?: string;
    availability?: string[];
  };
  onSelect?: () => void;
  selected?: boolean;
  detailed?: boolean;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onSelect,
  selected = false,
  detailed = false
}) => {
  // Default education if not provided
  const education = doctor.education || [
    {
      university: 'Harvard Medical School',
      degree: 'MD',
      year: '2010',
      country: 'USA'
    }
  ];

  // Card variants for animation
  const cardVariants = {
    hover: { y: -5, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' },
    tap: { y: 0, boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)' },
    selected: { borderColor: '#3b82f6', borderWidth: '2px' }
  };

  return (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={cardVariants}
      animate={selected ? 'selected' : 'default'}
      onClick={onSelect}
      className={`bg-white dark:bg-spotify-medium-gray rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-spotify-lighter-gray transition-all duration-200 hover:shadow-lg dark:hover:bg-spotify-light-gray ${selected ? 'ring-2 ring-spotify-green dark:ring-spotify-green' : ''} ${detailed ? 'p-0' : 'p-4'}`}
    >
      {detailed ? (
        <div>
          {/* Hero section with doctor image and overlay */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={doctor.image || '/images/default_user.jpg'}
              alt={doctor.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <div>
                <h3 className="text-xl font-bold text-white">{doctor.name}</h3>
                <p className="text-blue-200">{doctor.specialty}</p>
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="p-6">
            {/* Stats row */}
            <div className="flex justify-between mb-6">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="font-medium">{doctor.rating || '4.9'}</span>
                <span className="text-gray-500 text-sm ml-1">(120+ reviews)</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-1" />
                <span className="text-gray-600 dark:text-spotify-text-light">{doctor.location || 'Boston Medical Center'}</span>
              </div>
            </div>

            {/* Bio section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">About</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {doctor.bio || `Dr. ${doctor.name.split(' ')[1]} is a highly skilled ${doctor.specialty} with over ${doctor.experience || '10'} years of experience. Specializing in advanced treatments and patient-centered care.`}
              </p>
            </div>

            {/* Education section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                Education
              </h4>
              <ul className="space-y-2">
                {education.map((edu, index) => (
                  <li key={index} className="flex items-start">
                    <Award className="w-4 h-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{edu.degree}, {edu.university}</p>
                      <p className="text-gray-500 text-xs">{edu.year} • {edu.country}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability section */}
            <div>
              <h4 className="text-lg font-semibold mb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Availability
              </h4>
              <div className="flex flex-wrap gap-2">
                {(doctor.availability || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map((day, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={doctor.image || '/images/default_user.jpg'}
              alt={doctor.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900 dark:text-spotify-text-white">{doctor.name}</h3>
            <p className="text-sm text-gray-500 dark:text-spotify-text-light">{doctor.specialty}</p>
            <div className="flex items-center mt-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-xs ml-1">{doctor.rating || '4.9'}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-xs text-gray-500">{doctor.experience || '10'}+ years</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
