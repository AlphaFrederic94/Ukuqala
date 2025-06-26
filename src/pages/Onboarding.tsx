import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  User,
  Heart,
  Activity,
  Droplets,
  Brain,
  Stethoscope,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Step components
import WelcomeStep from '../components/onboarding/WelcomeStep';
import PersonalInfoStep from '../components/onboarding/PersonalInfoStep';
import MedicalInfoStep from '../components/onboarding/MedicalInfoStep';
import AppTourStep from '../components/onboarding/AppTourStep';
import CompletionStep from '../components/onboarding/CompletionStep';

// Types
interface OnboardingData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
  };
  medicalInfo: {
    bloodGroup: string;
    height: number;
    weight: number;
    allergies: string[];
    medications: string[];
  };
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    emailUpdates: boolean;
  };
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);

  // Initialize onboarding data
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalInfo: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: '',
      dateOfBirth: '',
      address: '',
    },
    medicalInfo: {
      bloodGroup: '',
      height: 0,
      weight: 0,
      allergies: [],
      medications: [],
    },
    preferences: {
      darkMode: false,
      notifications: true,
      emailUpdates: false,
    },
  });

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        // First check if the profile exists with onboarding_completed column
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          if (error) {
            // If profile doesn't exist, create it
            if (error.code === 'PGRST116') { // Record not found
              await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  onboarding_completed: false
                });
            } else {
              throw error;
            }
          } else if (data && data.onboarding_completed) {
            // User has already completed onboarding, redirect to home
            navigate('/');
          }
        } catch (columnError) {
          console.error('Error with onboarding_completed column:', columnError);

          // The column might not exist, let's check if the profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            await supabase
              .from('profiles')
              .insert({
                id: user.id
              });
          } else if (profileError) {
            throw profileError;
          }
          // Continue with onboarding since the column doesn't exist
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Continue with onboarding even if there's an error
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  // Steps configuration
  const steps = [
    { title: 'Welcome', component: WelcomeStep },
    { title: 'Personal Information', component: PersonalInfoStep },
    { title: 'Medical Information', component: MedicalInfoStep },
    { title: 'App Tour', component: AppTourStep },
    { title: 'All Set!', component: CompletionStep },
  ];

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle skip tour
  const handleSkipTour = () => {
    // Skip to completion step
    setCurrentStep(steps.length - 1);
  };

  // Handle onboarding completion
  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check if profile exists first
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        try {
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: onboardingData.personalInfo.fullName,
              phone: onboardingData.personalInfo.phone,
              address: onboardingData.personalInfo.address,
              date_of_birth: onboardingData.personalInfo.dateOfBirth,
              onboarding_completed: true,
            });

          if (createProfileError) throw createProfileError;
        } catch (columnError) {
          console.error('Error with onboarding_completed column:', columnError);

          // The column might not exist, try without it
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: onboardingData.personalInfo.fullName,
              phone: onboardingData.personalInfo.phone,
              address: onboardingData.personalInfo.address,
              date_of_birth: onboardingData.personalInfo.dateOfBirth
            });

          if (createProfileError) throw createProfileError;
        }
      } else {
        // Profile exists, update it
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: onboardingData.personalInfo.fullName,
              phone: onboardingData.personalInfo.phone,
              address: onboardingData.personalInfo.address,
              date_of_birth: onboardingData.personalInfo.dateOfBirth,
              onboarding_completed: true,
            })
            .eq('id', user.id);

          if (profileError) throw profileError;
        } catch (columnError) {
          console.error('Error with onboarding_completed column:', columnError);

          // The column might not exist, try without it
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: onboardingData.personalInfo.fullName,
              phone: onboardingData.personalInfo.phone,
              address: onboardingData.personalInfo.address,
              date_of_birth: onboardingData.personalInfo.dateOfBirth
            })
            .eq('id', user.id);

          if (profileError) throw profileError;
        }
      }

      // Update medical information
      const { error: medicalError } = await supabase
        .from('medical_records')
        .upsert({
          user_id: user.id,
          blood_group: onboardingData.medicalInfo.bloodGroup,
          height: onboardingData.medicalInfo.height,
          current_weight: onboardingData.medicalInfo.weight, // Fixed: use current_weight instead of weight
          target_weight: onboardingData.medicalInfo.targetWeight || null,
          date_of_birth: onboardingData.personalInfo.dateOfBirth,
          gender: onboardingData.medicalInfo.gender || 'Not Set',
          activity_level: onboardingData.medicalInfo.activityLevel || 'Not Set',
          allergies: onboardingData.medicalInfo.allergies,
          medications: onboardingData.medicalInfo.medications,
          health_conditions: onboardingData.medicalInfo.healthConditions || [],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (medicalError) throw medicalError;

      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: onboardingData.personalInfo.fullName,
          blood_group: onboardingData.medicalInfo.bloodGroup,
        },
      });

      if (metadataError) throw metadataError;

      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update onboarding data
  const updatePersonalInfo = (data: Partial<OnboardingData['personalInfo']>) => {
    setOnboardingData({
      ...onboardingData,
      personalInfo: {
        ...onboardingData.personalInfo,
        ...data,
      },
    });
  };

  const updateMedicalInfo = (data: Partial<OnboardingData['medicalInfo']>) => {
    setOnboardingData({
      ...onboardingData,
      medicalInfo: {
        ...onboardingData.medicalInfo,
        ...data,
      },
    });
  };

  const updatePreferences = (data: Partial<OnboardingData['preferences']>) => {
    setOnboardingData({
      ...onboardingData,
      preferences: {
        ...onboardingData.preferences,
        ...data,
      },
    });
  };

  // Skip onboarding (for testing)
  const handleSkipOnboarding = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
        })
        .eq('id', user.id);

      navigate('/');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  // Render current step
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-900">
      {/* Skip button (only for development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleSkipOnboarding}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Skip Onboarding</span>
        </button>
      )}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex-1 ${
                  index < steps.length - 1 ? 'relative' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-4 -right-1/2 w-full h-0.5 ${
                      index < currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`w-16 text-center ${
                  index === 0 ? 'text-left' : ''
                } ${index === steps.length - 1 ? 'text-right' : ''}`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <CurrentStepComponent
                data={onboardingData}
                updatePersonalInfo={updatePersonalInfo}
                updateMedicalInfo={updateMedicalInfo}
                updatePreferences={updatePreferences}
                onStartTour={() => setShowTour(true)}
                onSkipTour={handleSkipTour}
              />
            </motion.div>
          </AnimatePresence>

          {/* Error message */}
          {error && (
            <div className="px-8 pb-4">
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0 || loading}
              className={`flex items-center px-4 py-2 rounded-lg ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
