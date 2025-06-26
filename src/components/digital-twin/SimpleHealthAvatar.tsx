import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Heart, Activity, Droplets, Scale } from 'lucide-react';

interface HealthAvatarProps {
  healthData?: {
    bmi?: number;
    bloodPressure?: string;
    bloodSugar?: number;
    cholesterol?: number;
    heartRate?: number;
  };
}

const SimpleHealthAvatar: React.FC<HealthAvatarProps> = ({ healthData = {} }) => {
  const { t } = useTranslation();
  const { bmi = 24.2, bloodPressure = '120/80', bloodSugar = 90, cholesterol = 180, heartRate = 72 } = healthData;
  
  // Determine health status for visualization
  const getBmiStatus = () => {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  };
  
  const getBloodPressureStatus = () => {
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    if (systolic < 120 && diastolic < 80) return 'normal';
    if (systolic < 130 && diastolic < 80) return 'elevated';
    if (systolic < 140 || diastolic < 90) return 'hypertension1';
    return 'hypertension2';
  };
  
  const getBloodSugarStatus = () => {
    if (bloodSugar < 100) return 'normal';
    if (bloodSugar < 126) return 'prediabetes';
    return 'diabetes';
  };
  
  const getCholesterolStatus = () => {
    if (cholesterol < 200) return 'normal';
    if (cholesterol < 240) return 'borderline';
    return 'high';
  };
  
  const getHeartRateStatus = () => {
    if (heartRate < 60) return 'low';
    if (heartRate <= 100) return 'normal';
    return 'high';
  };
  
  const bmiStatus = getBmiStatus();
  const bpStatus = getBloodPressureStatus();
  const bsStatus = getBloodSugarStatus();
  const cholesterolStatus = getCholesterolStatus();
  const heartRateStatus = getHeartRateStatus();
  
  // Calculate overall health score (simplified)
  const calculateHealthScore = () => {
    let score = 0;
    
    // BMI score
    if (bmiStatus === 'normal') score += 20;
    else if (bmiStatus === 'underweight' || bmiStatus === 'overweight') score += 10;
    else score += 5;
    
    // Blood pressure score
    if (bpStatus === 'normal') score += 20;
    else if (bpStatus === 'elevated') score += 15;
    else if (bpStatus === 'hypertension1') score += 10;
    else score += 5;
    
    // Blood sugar score
    if (bsStatus === 'normal') score += 20;
    else if (bsStatus === 'prediabetes') score += 10;
    else score += 5;
    
    // Cholesterol score
    if (cholesterolStatus === 'normal') score += 20;
    else if (cholesterolStatus === 'borderline') score += 10;
    else score += 5;
    
    // Heart rate score
    if (heartRateStatus === 'normal') score += 20;
    else score += 10;
    
    return score;
  };
  
  const healthScore = calculateHealthScore();
  
  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2 dark:text-white">{t('digitalTwin.healthAvatar', 'Your Health Avatar')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('digitalTwin.healthAvatarDescription', 'Visual representation of your current health status')}</p>
      </div>
      
      <div className="flex flex-col items-center">
        {/* Avatar visualization */}
        <div className="relative mb-8">
          <div className="w-48 h-48 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-full flex items-center justify-center">
            <User className="w-24 h-24 text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Health indicators around avatar */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center">
            <Heart className={`w-6 h-6 ${
              heartRateStatus === 'normal' ? 'text-green-500' : 
              heartRateStatus === 'low' ? 'text-yellow-500' : 'text-red-500'
            }`} />
          </div>
          
          <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center">
            <Activity className={`w-6 h-6 ${
              bpStatus === 'normal' ? 'text-green-500' : 
              bpStatus === 'elevated' ? 'text-yellow-500' : 'text-red-500'
            }`} />
          </div>
          
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center">
            <Droplets className={`w-6 h-6 ${
              bsStatus === 'normal' ? 'text-green-500' : 
              bsStatus === 'prediabetes' ? 'text-yellow-500' : 'text-red-500'
            }`} />
          </div>
          
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center">
            <Scale className={`w-6 h-6 ${
              bmiStatus === 'normal' ? 'text-green-500' : 
              bmiStatus === 'underweight' ? 'text-yellow-500' : 'text-red-500'
            }`} />
          </div>
        </div>
        
        {/* Health score */}
        <div className="mb-6 text-center">
          <div className="inline-block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('digitalTwin.healthScore', 'Health Score')}</p>
            <p className="text-3xl font-bold">
              <span className={
                healthScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                healthScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              }>
                {healthScore}
              </span>
              <span className="text-gray-400 dark:text-gray-500">/100</span>
            </p>
          </div>
        </div>
        
        {/* Health metrics */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.bmi', 'BMI')}</p>
            <p className={`text-lg font-semibold ${
              bmiStatus === 'normal' ? 'text-green-600 dark:text-green-400' : 
              bmiStatus === 'underweight' || bmiStatus === 'overweight' ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}>
              {bmi}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.bloodPressure', 'Blood Pressure')}</p>
            <p className={`text-lg font-semibold ${
              bpStatus === 'normal' ? 'text-green-600 dark:text-green-400' : 
              bpStatus === 'elevated' ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}>
              {bloodPressure}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.bloodSugar', 'Blood Sugar')}</p>
            <p className={`text-lg font-semibold ${
              bsStatus === 'normal' ? 'text-green-600 dark:text-green-400' : 
              bsStatus === 'prediabetes' ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}>
              {bloodSugar} mg/dL
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.heartRate', 'Heart Rate')}</p>
            <p className={`text-lg font-semibold ${
              heartRateStatus === 'normal' ? 'text-green-600 dark:text-green-400' : 
              'text-yellow-600 dark:text-yellow-400'
            }`}>
              {heartRate} bpm
            </p>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('digitalTwin.avatarNote', 'Note: This is a simplified visualization. A 3D avatar will be available in future updates.')}
        </p>
      </div>
    </div>
  );
};

export default SimpleHealthAvatar;
