import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Activity, Upload, Stethoscope, Search, ChevronRight, Clock, Calendar, CheckCircle2, AlertCircle, Microscope, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { predictionService, Prediction, PredictionStats } from '../lib/predictionService';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import TutorialButton from '../components/tutorial/TutorialButton';
import PredictionComparisonFixed from '../components/predictions/PredictionComparisonFixed';
import IllustrationImage from '../components/IllustrationImage';

export default function Predictions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [stats, setStats] = useState<PredictionStats>({
    total_count: 0,
    low_risk_count: 0,
    moderate_risk_count: 0,
    high_risk_count: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch recent predictions and stats when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Fetch recent predictions
        const predictions = await predictionService.getRecentPredictions(user.id);
        setRecentPredictions(predictions);

        // Fetch prediction statistics
        const predictionStats = await predictionService.getPredictionStats(user.id);
        setStats(predictionStats);
      } catch (error) {
        console.error('Error fetching prediction data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  // Function to get icon based on prediction type
  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'heart_disease':
        return <Heart className="h-6 w-6 text-red-500 mr-3" />;
      case 'brain_cancer':
        return <Brain className="h-6 w-6 text-purple-500 mr-3" />;
      case 'skin_cancer':
        return <Microscope className="h-6 w-6 text-amber-500 mr-3" />;
      case 'diabetes':
        return <Activity className="h-6 w-6 text-blue-500 mr-3" />;
      case 'symptoms':
        return <Stethoscope className="h-6 w-6 text-emerald-500 mr-3" />;
      default:
        return <CheckCircle2 className="h-6 w-6 text-gray-500 mr-3" />;
    }
  };

  // Function to get result badge color
  const getResultBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'moderate':
        return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30';
      case 'high':
        return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'unknown':
        return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format time from ISO string
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section with Animated Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full animate-pulse" style={{ animationDuration: '7s' }}></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full animate-pulse" style={{ animationDuration: '5s' }}></div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="md:max-w-xl mb-8 md:mb-0">
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              AI-Powered Disease Prediction
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-blue-100 mb-6 max-w-3xl"
            >
              Our advanced AI models analyze your symptoms, medical data, and diagnostic images to provide accurate health insights and early disease detection.
            </motion.p>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="md:w-1/3 flex justify-center"
          >
            <IllustrationImage
              name="predictions"
              alt="AI Disease Prediction"
              className="max-w-full h-auto transform hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Prediction Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Select a Prediction Type</h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Brain Cancer Prediction */}
          <motion.div variants={itemVariants}>
            <Link
              to="/predictions/brain-cancer"
              className="block h-full border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-500 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors duration-300">Brain Cancer</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Upload MRI scans for AI-powered analysis
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium">
                  <Upload className="h-5 w-5 mr-2" />
                  <span className="mr-1">Upload Scan</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Heart Disease Prediction */}
          <motion.div variants={itemVariants}>
            <Link
              to="/predictions/heart-disease"
              className="block h-full border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-500 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors duration-300">Heart Disease</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Analyze cardiovascular health factors
                </p>
                <div className="flex items-center text-red-600 dark:text-red-400 font-medium">
                  <span className="mr-1">Start Assessment</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Skin Cancer Prediction */}
          <motion.div variants={itemVariants}>
            <Link
              to="/predictions/skin-cancer"
              className="block h-full border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-amber-500 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Microscope className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300">Skin Cancer</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Analyze skin lesions for early detection
                </p>
                <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                  <Upload className="h-5 w-5 mr-2" />
                  <span className="mr-1">Upload Image</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Diabetes Risk Assessment */}
          <motion.div variants={itemVariants}>
            <Link
              to="/predictions/diabetes"
              className="block h-full border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">Diabetes</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Assess diabetes risk based on health metrics
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                  <span className="mr-1">Start Assessment</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Symptoms Prediction */}
          <motion.div variants={itemVariants}>
            <Link
              to="/predictions/symptoms"
              className="block h-full border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-emerald-500 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-300">Symptoms Prediction</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Analyze symptoms to predict possible conditions
                </p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                  <Search className="h-5 w-5 mr-2" />
                  <span className="mr-1">Search Symptoms</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Recent Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Recent Predictions</h2>
          <div className="flex items-center space-x-4">
            {recentPredictions.length >= 2 && (
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                {t('predictions.compareWithPrevious')}
              </button>
            )}
            <Link to="/profile" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : recentPredictions.length > 0 ? (
              recentPredictions.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow duration-300 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center">
                    {getPredictionIcon(prediction.prediction_type)}
                    <div>
                      <p className="font-medium dark:text-white">{prediction.title}</p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span className="mr-3">Completed on {formatDate(prediction.created_at)}</span>
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>{formatTime(prediction.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getResultBadgeColor(prediction.risk_level)}`}>
                    {prediction.result}
                  </span>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8"
              >
                <div className="mb-4 flex justify-center">
                  <IllustrationImage
                    name="empty-state"
                    alt="No predictions found"
                    className="h-40"
                  />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No predictions found. Start by selecting a prediction type above.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Predictions</h3>
              <div className="bg-blue-100 dark:bg-blue-800/50 w-8 h-8 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 dark:text-white">{stats.total_count}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Low Risk Results</h3>
              <div className="bg-green-100 dark:bg-green-800/50 w-8 h-8 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 dark:text-white">{stats.low_risk_count}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400">Moderate Risk</h3>
              <div className="bg-amber-100 dark:bg-amber-800/50 w-8 h-8 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 dark:text-white">{stats.moderate_risk_count}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Prediction Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <PredictionComparisonFixed
            predictions={recentPredictions}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}