import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, Activity, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WelcomeStepProps {
  data: any;
  updatePersonalInfo: (data: any) => void;
  updateMedicalInfo: (data: any) => void;
  updatePreferences: (data: any) => void;
  onStartTour: () => void;
  onSkipTour: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ data }) => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src="/images/welcome_illustration.svg"
          alt="Welcome to CareAI"
          className="h-48 mx-auto mb-6"
          onError={(e) => {
            e.currentTarget.src = '/images/logo.png';
            e.currentTarget.className = 'h-24 mx-auto mb-6';
          }}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-bold mb-4 text-gray-900 dark:text-white"
      >
        Welcome to CareAI, {firstName}!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        className="text-lg text-gray-600 dark:text-gray-300 mb-8"
      >
        Let's set up your profile to personalize your healthcare experience.
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center"
        >
          <Heart className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h3 className="font-medium text-red-700 dark:text-red-400">Heart Disease</h3>
          <p className="text-sm text-red-600 dark:text-red-300">
            Early detection and risk assessment
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center"
        >
          <Brain className="h-10 w-10 text-purple-500 mx-auto mb-2" />
          <h3 className="font-medium text-purple-700 dark:text-purple-400">Brain Health</h3>
          <p className="text-sm text-purple-600 dark:text-purple-300">
            Advanced neural analysis
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center"
        >
          <Activity className="h-10 w-10 text-blue-500 mx-auto mb-2" />
          <h3 className="font-medium text-blue-700 dark:text-blue-400">Health Tracking</h3>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Monitor vital signs and activities
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center"
        >
          <Stethoscope className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <h3 className="font-medium text-green-700 dark:text-green-400">Medical Advice</h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            AI-powered health recommendations
          </p>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1 } }}
        className="text-gray-600 dark:text-gray-400 mb-4"
      >
        This will only take a few minutes. Let's get started!
      </motion.p>
    </div>
  );
};

export default WelcomeStep;
