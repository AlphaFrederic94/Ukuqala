import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Heart, Activity, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CompletionStepProps {
  data: any;
  updatePersonalInfo: (data: any) => void;
  updateMedicalInfo: (data: any) => void;
  updatePreferences: (data: any) => void;
  onStartTour: () => void;
  onSkipTour: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = () => {
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="mb-6"
      >
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-bold mb-4 text-gray-900 dark:text-white"
      >
        You're All Set, {firstName}!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        className="text-lg text-gray-600 dark:text-gray-300 mb-8"
      >
        Your profile is complete and you're ready to start using CareAI.
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center"
        >
          <Heart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <h3 className="font-medium text-blue-700 dark:text-blue-400">Health Predictions</h3>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Get personalized health risk assessments
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center"
        >
          <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <h3 className="font-medium text-green-700 dark:text-green-400">Health Tracking</h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            Monitor your daily health metrics
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center"
        >
          <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <h3 className="font-medium text-purple-700 dark:text-purple-400">Appointments</h3>
          <p className="text-sm text-purple-600 dark:text-purple-300">
            Schedule and manage doctor visits
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg text-center"
        >
          <MessageSquare className="h-8 w-8 text-teal-500 mx-auto mb-2" />
          <h3 className="font-medium text-teal-700 dark:text-teal-400">Medical Chatbot</h3>
          <p className="text-sm text-teal-600 dark:text-teal-300">
            Get instant answers to health questions
          </p>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1 } }}
        className="text-gray-600 dark:text-gray-400 mb-4"
      >
        Click "Get Started" to begin your health journey with CareAI!
      </motion.p>
    </div>
  );
};

export default CompletionStep;
