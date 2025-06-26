import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { motion } from 'framer-motion';
import FormField from './FormField';
import Tooltip from '../ui/Tooltip';
import AutoSave from './AutoSave';

interface PersonalInfoSectionProps {
  profileData: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: string;
  };
  editMode: boolean;
  onProfileChange: (field: string, value: string) => void;
  onSave?: () => Promise<boolean>;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  profileData,
  editMode,
  onProfileChange,
  onSave = async () => true
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [initialData, setInitialData] = useState(profileData);

  // Reset dirty state when edit mode changes or when saved
  useEffect(() => {
    setInitialData(profileData);
    setIsDirty(false);
  }, [editMode]);

  // Custom onChange handler to track dirty state
  const handleChange = (field: string, value: string) => {
    onProfileChange(field, value);

    // Check if any field has changed from initial state
    const hasChanged = (
      value !== initialData[field as keyof typeof initialData] ||
      Object.keys(profileData).some(key => {
        const typedKey = key as keyof typeof profileData;
        return profileData[typedKey] !== initialData[typedKey];
      })
    );

    setIsDirty(hasChanged);
  };
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold dark:text-white flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Personal Information
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Full Name */}
        <motion.div variants={itemVariants} className="group card-hover">
          <FormField
            label="Full Name"
            value={profileData.full_name}
            onChange={(value) => handleChange('full_name', value)}
            icon={<User className="w-5 h-5" />}
            disabled={!editMode}
            placeholder="Enter your full name"
            required={true}
            validationRules={[
              { test: (value) => value.length >= 3, message: 'Name must be at least 3 characters' },
              { test: (value) => /^[a-zA-Z\s'-]+$/.test(value), message: 'Name can only contain letters, spaces, hyphens and apostrophes' }
            ]}
            helpText="Your full legal name as it appears on official documents"
            iconColor="text-blue-400"
            autoComplete="name"
          />
        </motion.div>

        {/* Email */}
        <motion.div variants={itemVariants} className="group card-hover">
          <FormField
            label="Email Address"
            value={profileData.email}
            onChange={(value) => handleChange('email', value)}
            icon={<Mail className="w-5 h-5" />}
            disabled={!editMode}
            type="email"
            placeholder="Enter your email address"
            required={true}
            validationRules={[
              { test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: 'Please enter a valid email address' }
            ]}
            helpText="Your primary email address for account notifications and communications"
            iconColor="text-purple-400"
            autoComplete="email"
          />
        </motion.div>

        {/* Phone */}
        <motion.div variants={itemVariants} className="group card-hover">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors card-icon">
                <Phone className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 card-content">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <Tooltip
                  content="Your contact number for appointment reminders and emergency communications"
                  position="top"
                />
              </div>
              <PhoneInput
                country={'us'}
                value={profileData.phone}
                onChange={(phone) => handleChange('phone', phone)}
                disabled={!editMode}
                containerClass="w-full"
                inputClass={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all form-input-focus ${!editMode ? 'opacity-70' : ''}`}
                buttonClass={!editMode ? 'opacity-70' : ''}
              />
            </div>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div variants={itemVariants} className="group card-hover">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40 transition-colors card-icon">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 card-content">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <Tooltip
                  content="Your residential address for medical records and emergency services"
                  position="top"
                />
              </div>
              <textarea
                value={profileData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={!editMode}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none form-input-focus"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </motion.div>

        {/* Date of Birth */}
        <motion.div variants={itemVariants} className="group card-hover">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors card-icon">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 card-content">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                <Tooltip
                  content="Your date of birth is used to calculate age-related health metrics and recommendations"
                  position="top"
                />
              </div>
              <input
                type="date"
                value={profileData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                disabled={!editMode}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all form-input-focus"
              />
            </div>
          </div>
        </motion.div>

        {/* Auto-save component */}
        {editMode && <AutoSave onSave={onSave} isDirty={isDirty} />}
      </div>
    </motion.div>
  );
};

export default PersonalInfoSection;
