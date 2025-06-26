import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
// Import a simple component that doesn't rely on Three.js
import HealthSimulation from '../../components/digital-twin/HealthSimulation';
import MedicationSimulation from '../../components/digital-twin/MedicationSimulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, User, Activity, Pill, Calendar, Info, Heart, Droplets, Scale, Image } from 'lucide-react';
import AvatarSelector from '../../components/digital-twin/AvatarSelector';

const DigitalTwinPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [healthData, setHealthData] = useState({
    healthScore: 75,
    bodyParts: [
      { name: 'Heart', status: 'normal', risk: 'low' },
      { name: 'Lungs', status: 'normal', risk: 'low' },
      { name: 'Liver', status: 'normal', risk: 'low' },
      { name: 'Kidneys', status: 'normal', risk: 'low' },
      { name: 'Brain', status: 'normal', risk: 'low' }
    ],
    metrics: {
      bmi: 24.5,
      bloodPressure: '120/80',
      bloodSugar: 95,
      cholesterol: 180
    }
  });

  // Fetch user profile data including avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        // Fetch user profile from database
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
          throw error;
        }

        if (data && data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch user health data
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch health metrics from database
        const { data, error } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - we'll handle this by creating default data
          console.error('Error fetching health data:', error);
          throw error;
        }

        if (data) {
          // Calculate health score and body part statuses based on metrics
          const calculatedHealthScore = calculateHealthScore(data);
          const bodyPartStatuses = determineBodyPartStatuses(data);

          setHealthData({
            healthScore: calculatedHealthScore,
            bodyParts: bodyPartStatuses,
            metrics: {
              bmi: data.bmi || 24.5,
              bloodPressure: data.blood_pressure || '120/80',
              bloodSugar: data.blood_sugar || 95,
              cholesterol: data.cholesterol || 180
            }
          });
        } else {
          // Create default health data if none exists
          await createDefaultHealthData();
        }
      } catch (error) {
        console.error('Error in health data processing:', error);
      } finally {
        setLoading(false);
      }
    };

    // Create default health data for new users
    const createDefaultHealthData = async () => {
      try {
        const defaultData = {
          user_id: user.id,
          bmi: 24.5,
          blood_pressure: '120/80',
          blood_sugar: 95,
          cholesterol: 180,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('health_metrics')
          .insert([defaultData]);

        if (error) throw error;

        console.log('Created default health data for user');
      } catch (error) {
        console.error('Error creating default health data:', error);
      }
    };

    // Placeholder functions for health calculations
    const calculateHealthScore = (data) => {
      // Simplified health score calculation
      let score = 75; // Default score

      // Adjust based on BMI
      if (data.bmi) {
        if (data.bmi < 18.5 || data.bmi > 30) score -= 10;
        else if (data.bmi > 25) score -= 5;
      }

      // Adjust based on blood pressure
      if (data.blood_pressure) {
        const [systolic, diastolic] = data.blood_pressure.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) score -= 15;
        else if (systolic > 130 || diastolic > 85) score -= 7;
      }

      // Adjust based on blood sugar
      if (data.blood_sugar) {
        if (data.blood_sugar > 126) score -= 15;
        else if (data.blood_sugar > 100) score -= 7;
      }

      // Adjust based on cholesterol
      if (data.cholesterol) {
        if (data.cholesterol > 240) score -= 15;
        else if (data.cholesterol > 200) score -= 7;
      }

      return Math.max(0, Math.min(100, score));
    };

    const determineBodyPartStatuses = (data) => {
      // Simplified body part status determination
      const bodyParts = [
        { name: 'Heart', status: 'normal', risk: 'low' },
        { name: 'Lungs', status: 'normal', risk: 'low' },
        { name: 'Liver', status: 'normal', risk: 'low' },
        { name: 'Kidneys', status: 'normal', risk: 'low' },
        { name: 'Brain', status: 'normal', risk: 'low' }
      ];

      // Check heart health based on blood pressure and cholesterol
      if (data.blood_pressure) {
        const [systolic, diastolic] = data.blood_pressure.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) {
          bodyParts[0].status = 'issue';
          bodyParts[0].risk = 'high';
        } else if (systolic > 130 || diastolic > 85) {
          bodyParts[0].status = 'warning';
          bodyParts[0].risk = 'medium';
        }
      }

      if (data.cholesterol && data.cholesterol > 240) {
        bodyParts[0].status = 'issue';
        bodyParts[0].risk = 'high';
      } else if (data.cholesterol && data.cholesterol > 200) {
        bodyParts[0].status = 'warning';
        bodyParts[0].risk = 'medium';
      }

      // Check liver health based on liver enzymes if available
      if (data.alt && data.alt > 50) {
        bodyParts[2].status = 'issue';
        bodyParts[2].risk = 'high';
      } else if (data.alt && data.alt > 35) {
        bodyParts[2].status = 'warning';
        bodyParts[2].risk = 'medium';
      }

      // Check kidney health based on creatinine if available
      if (data.creatinine && data.creatinine > 1.2) {
        bodyParts[3].status = 'issue';
        bodyParts[3].risk = 'high';
      } else if (data.creatinine && data.creatinine > 1.0) {
        bodyParts[3].status = 'warning';
        bodyParts[3].risk = 'medium';
      }

      return bodyParts;
    };

    fetchHealthData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-6"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('digitalTwin.title', 'Your Digital Health Twin')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('digitalTwin.description', 'Visualize your health status and simulate how lifestyle changes could impact your future health.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center mb-4">
              <Info className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('digitalTwin.aboutTitle', 'About Your Digital Twin')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t('digitalTwin.aboutDescription', 'Your Digital Health Twin is a personalized health model that represents your current health status and can simulate potential future outcomes based on lifestyle changes and medical interventions. Use the tabs below to explore different aspects of your health twin.')}
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="avatar" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="avatar" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                {t('digitalTwin.tabs.avatar', 'Health Avatar')}
              </TabsTrigger>
              <TabsTrigger value="lifestyle" className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                {t('digitalTwin.tabs.lifestyle', 'Lifestyle Simulation')}
              </TabsTrigger>
              <TabsTrigger value="medication" className="flex items-center">
                <Pill className="w-4 h-4 mr-2" />
                {t('digitalTwin.tabs.medication', 'Medication Effects')}
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('digitalTwin.tabs.timeline', 'Health Timeline')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="avatar" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold mb-2 dark:text-white">{t('digitalTwin.healthAvatar', 'Your Health Avatar')}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('digitalTwin.healthAvatarDescription', 'Visual representation of your current health status')}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    {/* Avatar visualization with animations */}
                    <div className="relative mb-8">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-48 h-48 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-full overflow-hidden flex items-center justify-center"
                      >
                        {avatarUrl ? (
                          <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            src={avatarUrl}
                            alt={t('avatar.yourAvatar', 'Your avatar')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                          >
                            <User className="w-24 h-24 text-blue-600 dark:text-blue-400" />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Health indicators around avatar with animations */}
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                        >
                          <Heart className="w-6 h-6 text-green-500" />
                        </motion.div>
                      </motion.div>

                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="absolute top-1/2 -right-8 transform -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ rotate: [0, 5, 0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Activity className="w-6 h-6 text-green-500" />
                        </motion.div>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="absolute -bottom-4 -right-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ y: [0, -2, 0, 2, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Droplets className="w-6 h-6 text-green-500" />
                        </motion.div>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className="absolute -bottom-4 -left-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ rotate: [0, 0, 10, 0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                        >
                          <Scale className="w-6 h-6 text-green-500" />
                        </motion.div>
                      </motion.div>
                    </div>

                  {/* Health score with animation */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="mb-6 text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className="inline-block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('digitalTwin.healthScore', 'Health Score')}</p>
                      <p className="text-3xl font-bold">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9, duration: 0.5 }}
                          className="text-green-600 dark:text-green-400"
                        >
                          {healthData.healthScore}
                        </motion.span>
                        <span className="text-gray-400 dark:text-gray-500">/100</span>
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* Health metrics with animations */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      whileHover={{ scale: 1.03 }}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.bmi', 'BMI')}</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {healthData.metrics.bmi}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.4 }}
                      whileHover={{ scale: 1.03 }}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.bloodPressure', 'Blood Pressure')}</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {healthData.metrics.bloodPressure}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.0, duration: 0.4 }}
                      whileHover={{ scale: 1.03 }}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.bloodSugar', 'Blood Sugar')}</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {healthData.metrics.bloodSugar} mg/dL
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.1, duration: 0.4 }}
                      whileHover={{ scale: 1.03 }}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('digitalTwin.cholesterol', 'Cholesterol')}</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {healthData.metrics.cholesterol} mg/dL
                      </p>
                    </motion.div>
                  </div>

                  <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                    {t('digitalTwin.avatarNote', 'Note: This is a simplified visualization. A 3D avatar will be available in future updates.')}
                  </p>
                </div>
                </div>

                {/* Avatar selector */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <AvatarSelector
                    currentAvatar={avatarUrl || undefined}
                    onAvatarChange={(url) => {
                      setAvatarUrl(url);
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lifestyle" className="mt-0">
              <HealthSimulation initialHealthData={healthData} />
            </TabsContent>

            <TabsContent value="medication" className="mt-0">
              <MedicationSimulation initialHealthData={healthData} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('digitalTwin.timelineTitle', 'Health Timeline')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('digitalTwin.timelineDescription', 'This feature will show your projected health trajectory over time based on your current health status and lifestyle choices.')}
                </p>
                <div className="flex justify-center items-center h-64 mt-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('common.comingSoon', 'Coming soon')}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t('digitalTwin.disclaimer', 'Health Simulation Disclaimer')}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {t('digitalTwin.disclaimerText', 'The Digital Health Twin provides simulations based on general health models and is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DigitalTwinPage;
