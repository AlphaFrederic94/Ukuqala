import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, updateProfile, updateMedicalRecords, getProfileAndMedicalRecords } from '../lib/supabaseClient';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/profile.css';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

// Import custom components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import PersonalInfoSection from '../components/profile/PersonalInfoSection';
import MedicalInfoSection from '../components/profile/MedicalInfoSection';
import SecuritySection from '../components/profile/SecuritySection';
import ProfileNotification from '../components/profile/ProfileNotification';
import AccountDeletion from '../components/profile/AccountDeletion';
import Interactive3DCard from '../components/profile/Interactive3DCard';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  avatar_url: string;
}

interface MedicalData {
  blood_group: string;
  height: number;
  weight: number;
  allergies: string[];
  medications: string[];
}

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [originalData, setOriginalData] = useState<{ profile: ProfileData; medical: MedicalData } | null>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'security'>(
    location.state?.activeTab || 'personal'
  );
  const [showChangePassword, setShowChangePassword] = useState<boolean>(
    location.state?.showChangePassword || false
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Initialize with default values
  const defaultProfileData: ProfileData = {
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    avatar_url: ''
  };

  const defaultMedicalData: MedicalData = {
    blood_group: '',
    height: 0,
    weight: 0,
    allergies: [],
    medications: []
  };

  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
  const [medicalData, setMedicalData] = useState<MedicalData>(defaultMedicalData);

  const validateProfile = () => {
    const errors: string[] = [];

    if (!profileData.full_name.trim()) {
      errors.push('Full name is required');
    }

    if (!profileData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Please enter a valid email address');
    }

    if (!profileData.phone) {
      errors.push('Phone number is required');
    }

    if (!profileData.date_of_birth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(profileData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        errors.push('Please enter a valid date of birth');
      }
    }

    if (!profileData.address.trim()) {
      errors.push('Address is required');
    }

    // Medical data validation
    if (medicalData.height <= 0 || medicalData.height > 300) {
      errors.push('Please enter a valid height (1-300 cm)');
    }

    if (medicalData.weight <= 0 || medicalData.weight > 500) {
      errors.push('Please enter a valid weight (1-500 kg)');
    }

    if (!medicalData.blood_group) {
      errors.push('Blood group is required');
    }

    return errors;
  };

  // Calculate profile completion percentage
  const calculateCompletionPercentage = (profile: ProfileData, medical: MedicalData) => {
    const fields = [
      !!profile.full_name,
      !!profile.email,
      !!profile.phone,
      !!profile.address,
      !!profile.date_of_birth,
      !!profile.avatar_url,
      !!medical.blood_group,
      medical.height > 0,
      medical.weight > 0,
      medical.allergies.length > 0,
      medical.medications.length > 0
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setUploadingPhoto(true);
    setError(null);

    try {
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);

      if (data) {
        // Update the profile with the new avatar URL
        const newAvatarUrl = data.publicUrl;
        setProfileData(prev => ({ ...prev, avatar_url: newAvatarUrl }));

        // If not in edit mode, save the change immediately
        if (!editMode) {
          await updateProfile(user.id, { avatar_url: newAvatarUrl });
          setSuccess('Profile photo updated successfully');
          setTimeout(() => setSuccess(null), 3000);
        }
      }
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Dark mode is now handled by ThemeContext

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getProfileAndMedicalRecords(user.id);

        if (data.profile) {
          const sanitizedProfile = {
            full_name: data.profile.full_name || '',
            email: data.profile.email || '',
            phone: data.profile.phone || '',
            address: data.profile.address || '',
            date_of_birth: data.profile.date_of_birth || '',
            avatar_url: data.profile.avatar_url
          };
          setProfileData(sanitizedProfile);
          setOriginalData(prev => ({ ...prev, profile: sanitizedProfile }));
        }

        if (data.medicalRecords) {
          const sanitizedMedical = {
            blood_group: data.medicalRecords.blood_group || '',
            height: Number(data.medicalRecords.height) || 0,
            weight: Number(data.medicalRecords.weight) || 0,
            allergies: Array.isArray(data.medicalRecords.allergies) ? data.medicalRecords.allergies : [],
            medications: Array.isArray(data.medicalRecords.medications) ? data.medicalRecords.medications : []
          };
          setMedicalData(sanitizedMedical);
          setOriginalData(prev => ({ ...prev, medical: sanitizedMedical }));
        }

        // Calculate profile completion percentage
        const profile = data.profile || defaultProfileData;
        const medical = data.medicalRecords || defaultMedicalData;
        const percentage = calculateCompletionPercentage(
          {
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            date_of_birth: profile.date_of_birth || '',
            avatar_url: profile.avatar_url
          },
          {
            blood_group: medical.blood_group || '',
            height: Number(medical.height) || 0,
            weight: Number(medical.weight) || 0,
            allergies: Array.isArray(medical.allergies) ? medical.allergies : [],
            medications: Array.isArray(medical.medications) ? medical.medications : []
          }
        );
        setCompletionPercentage(percentage);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return false;

    const validationErrors = validateProfile();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      setTimeout(() => setError(null), 5000);
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Update both profile and medical records
      await Promise.all([
        updateProfile(user.id, profileData),
        updateMedicalRecords(user.id, {
          ...medicalData,
          current_weight: medicalData.weight,
          updated_at: new Date().toISOString()
        })
      ]);

      // Also update the weight_measurements table with the new weight
      if (medicalData.weight > 0) {
        await supabase.from('weight_measurements').insert([
          {
            user_id: user.id,
            weight: medicalData.weight,
            date: new Date().toISOString(),
            notes: 'Updated from profile'
          }
        ]);
      }

      // Update original data and recalculate completion percentage
      const updatedData = { profile: profileData, medical: medicalData };
      setOriginalData(updatedData);
      setCompletionPercentage(calculateCompletionPercentage(profileData, medicalData));

      setSuccess('Profile updated successfully');
      setLastSaved(new Date());
      setTimeout(() => setSuccess(null), 3000);
      setEditMode(false);
      return true;
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-save handler for individual sections
  const handleAutoSave = async (): Promise<boolean> => {
    if (!autoSaveEnabled || !editMode || !user) return true;

    try {
      // Only update the relevant section based on active tab
      if (activeTab === 'personal') {
        await updateProfile(user.id, profileData);
      } else if (activeTab === 'medical') {
        await updateMedicalRecords(user.id, {
          ...medicalData,
          current_weight: medicalData.weight,
          updated_at: new Date().toISOString()
        });
      }

      setLastSaved(new Date());
      return true;
    } catch (error: any) {
      console.error('Error auto-saving profile:', error);
      return false;
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setProfileData(originalData.profile);
      setMedicalData(originalData.medical);
    }
    setEditMode(false);
  };

  const handleAddAllergy = () => {
    setMedicalData(prev => ({
      ...prev,
      allergies: [...prev.allergies, '']
    }));
  };

  const handleAddMedication = () => {
    setMedicalData(prev => ({
      ...prev,
      medications: [...prev.medications, '']
    }));
  };

  const handleRemoveAllergy = (index: number) => {
    setMedicalData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveMedication = (index: number) => {
    setMedicalData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Handle profile data changes
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Handle medical data changes
  const handleMedicalChange = (field: string, value: any) => {
    setMedicalData(prev => ({ ...prev, [field]: value }));
  };

  // Clear notifications
  const clearNotifications = () => {
    setError(null);
    setSuccess(null);
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 particle-bg"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div
        className="flex items-center mb-8"
        variants={itemVariants}
      >
        <BackButton />
        <h1 className="text-3xl font-bold ml-4 dark:text-white">My Profile</h1>

        <div className="ml-auto flex items-center space-x-2">
          <motion.div
            className="text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {lastSaved ? (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>No changes saved yet</span>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {(success || error) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProfileNotification
              success={success}
              error={error}
              onDismiss={clearNotifications}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header with Photo */}
      <ProfileHeader
        profileData={profileData}
        editMode={editMode}
        completionPercentage={completionPercentage}
        onEditToggle={() => setEditMode(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        onPhotoUpload={handlePhotoUpload}
        loading={loading}
      />

      {/* 3D Interactive User Card */}
      <motion.div
        className="mb-8"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Digital Identity Card
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Your interactive 3D patient card with QR code for quick access to non-sensitive information
          </p>
        </div>
        <Interactive3DCard
          profileData={profileData}
          medicalData={medicalData}
          className="max-w-2xl mx-auto"
        />
      </motion.div>

      {/* Tab Navigation */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'personal' && (
          <motion.div
            key="personal"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-pattern-personal relative overflow-hidden rounded-xl glass-effect card-hover-lift"
          >
            {/* Enhanced decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-400 to-cyan-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 animate-float"></div>

            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <PersonalInfoSection
              profileData={profileData}
              editMode={editMode}
              onProfileChange={handleProfileChange}
              onSave={handleAutoSave}
            />
          </motion.div>
        )}

        {activeTab === 'medical' && (
          <motion.div
            key="medical"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-pattern-medical relative overflow-hidden rounded-xl glass-effect card-hover-lift"
          >
            {/* Enhanced decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500 to-emerald-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-400 to-teal-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 animate-float"></div>

            {/* Medical cross pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M25 15h10v30h-10zm-10 10h30v10h-30z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <MedicalInfoSection
              medicalData={medicalData}
              editMode={editMode}
              onMedicalChange={handleMedicalChange}
              onAddAllergy={handleAddAllergy}
              onRemoveAllergy={handleRemoveAllergy}
              onAddMedication={handleAddMedication}
              onRemoveMedication={handleRemoveMedication}
            />
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-pattern-security relative overflow-hidden rounded-xl"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 opacity-5 rounded-full translate-y-1/2 -translate-x-1/4"></div>

            <SecuritySection
              autoSaveEnabled={autoSaveEnabled}
              onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
              lastSaved={lastSaved}
              initialShowChangePassword={showChangePassword}
            />

            <motion.div
              className="mt-8"
              variants={itemVariants}
            >
              <AccountDeletion />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating edit button (mobile only) */}
      {!editMode && (
        <motion.button
          className="fixed bottom-6 right-6 md:hidden bg-blue-600 text-white p-4 rounded-full shadow-lg z-10"
          onClick={() => setEditMode(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  );
}
