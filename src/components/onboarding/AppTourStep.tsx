import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Heart, 
  Activity, 
  Calendar, 
  User, 
  Settings, 
  MessageSquare, 
  Droplets, 
  Moon, 
  Utensils,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface AppTourStepProps {
  data: any;
  updatePersonalInfo: (data: any) => void;
  updateMedicalInfo: (data: any) => void;
  updatePreferences: (data: any) => void;
  onStartTour: () => void;
  onSkipTour: () => void;
}

const AppTourStep: React.FC<AppTourStepProps> = ({ 
  onStartTour,
  onSkipTour
}) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      title: 'Dashboard',
      description: 'Get a quick overview of your health metrics, upcoming appointments, and recent predictions.',
      icon: Home,
      color: 'blue',
      image: '/images/dashboard.png'
    },
    {
      title: 'Health Predictions',
      description: 'Access AI-powered disease risk assessments for heart disease, diabetes, and more.',
      icon: Heart,
      color: 'red',
      image: '/images/predictions.png'
    },
    {
      title: 'Health Tracking',
      description: 'Monitor your water intake, sleep patterns, and nutrition to maintain a healthy lifestyle.',
      icon: Activity,
      color: 'green',
      image: '/images/tracking.png'
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage appointments with healthcare providers.',
      icon: Calendar,
      color: 'purple',
      image: '/images/appointments.png'
    },
    {
      title: 'Medical Chatbot',
      description: 'Get instant answers to your health questions from our AI-powered medical assistant.',
      icon: MessageSquare,
      color: 'teal',
      image: '/images/chatbot.png'
    }
  ];

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
    }
  };

  const currentFeatureData = features[currentFeature];
  const IconComponent = currentFeatureData.icon;
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'red':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'green':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'purple':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      case 'teal':
        return 'text-teal-500 bg-teal-100 dark:bg-teal-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          App Features Tour
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Let's explore the key features of CareAI to help you get started.
        </p>
      </motion.div>

      <motion.div
        key={currentFeature}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md"
      >
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          <img
            src={currentFeatureData.image}
            alt={currentFeatureData.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.png';
              e.currentTarget.className = 'w-full h-full object-contain p-4';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
            <div className="p-4 text-white">
              <h3 className="text-xl font-bold">{currentFeatureData.title}</h3>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${getColorClasses(currentFeatureData.color)} mr-3`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentFeatureData.title}
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {currentFeatureData.description}
          </p>
          
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentFeature === 0}
              className={`px-4 py-2 rounded-lg ${
                currentFeature === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentFeature
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                ></div>
              ))}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentFeature === features.length - 1}
              className={`px-4 py-2 rounded-lg ${
                currentFeature === features.length - 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onSkipTour}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Complete Setup
        </button>
      </div>
    </div>
  );
};

export default AppTourStep;
