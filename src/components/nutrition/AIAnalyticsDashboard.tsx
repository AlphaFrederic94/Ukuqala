import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  RefreshCw,
  Download,
  Calendar,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '@/contexts/AuthContext';
import { aiNutritionService, NutritionAnalysisResponse } from '@/lib/aiNutritionService';
import { nutritionService } from '@/lib/nutritionService';
import { useEnhancedToast } from '@/components/ui/EnhancedToast';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

interface AIAnalyticsDashboardProps {
  timeframe: 'daily' | 'weekly' | 'monthly';
  onTimeframeChange: (timeframe: 'daily' | 'weekly' | 'monthly') => void;
}

export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({
  timeframe,
  onTimeframeChange
}) => {
  const { user } = useAuth();
  const toast = useEnhancedToast();
  const [analysis, setAnalysis] = useState<NutritionAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mealData, setMealData] = useState<any[]>([]);
  const [waterData, setWaterData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalysisData();
    }
  }, [user, timeframe]);

  const loadAnalysisData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load meal and water data
      const [meals, water] = await Promise.all([
        nutritionService.getMealLogs(user.id, 30),
        nutritionService.getWaterLogs(user.id, 30)
      ]);

      setMealData(meals);
      setWaterData(water);

      // Get user profile data (you might want to fetch this from user settings)
      const userProfile = {
        age: 30, // Default values - should come from user profile
        gender: 'male',
        weight: 70,
        height: 175,
        activityLevel: 'moderate',
        goals: ['weight_loss', 'muscle_gain']
      };

      // Request AI analysis
      const analysisResult = await aiNutritionService.analyzeNutrition({
        userId: user.id,
        timeframe,
        mealLogs: meals,
        waterLogs: water,
        userProfile
      });

      setAnalysis(analysisResult);

      // Show AI insights as toast
      if (analysisResult.insights.length > 0) {
        toast.aiInsight(
          'AI Analysis Complete',
          'Your nutrition data has been analyzed with personalized insights.',
          analysisResult.insights.slice(0, 3)
        );
      }

    } catch (error) {
      console.error('Error loading analysis data:', error);
      toast.error(
        'Analysis Failed',
        'Unable to generate AI analysis. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!analysis) return;

    toast.info(
      'Generating Report',
      'Creating your personalized nutrition report...'
    );

    // Simulate report generation
    setTimeout(() => {
      toast.success(
        'Report Ready',
        'Your nutrition report has been generated successfully.',
        {
          action: {
            label: 'Download PDF',
            onClick: () => {
              // Implement PDF download logic
              console.log('Downloading PDF report...');
            }
          }
        }
      );
    }, 2000);
  };

  // Chart data configurations
  const macroChartData = analysis ? {
    labels: ['Protein', 'Carbs', 'Fats'],
    datasets: [{
      data: [
        analysis.macroAnalysis.protein.current,
        analysis.macroAnalysis.carbs.current,
        analysis.macroAnalysis.fats.current
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)'
      ],
      borderWidth: 2
    }]
  } : null;

  const caloriesTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Daily Calories',
      data: [2100, 1950, 2200, 1800, 2050, 2300, 1900],
      borderColor: 'rgba(139, 69, 19, 1)',
      backgroundColor: 'rgba(139, 69, 19, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const hydrationData = {
    labels: ['Target', 'Current'],
    datasets: [{
      label: 'Water Intake (ml)',
      data: analysis ? [
        analysis.hydrationAnalysis.target,
        analysis.hydrationAnalysis.averageIntake
      ] : [2000, 1500],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(14, 165, 233, 0.8)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(14, 165, 233, 1)'
      ],
      borderWidth: 2
    }]
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Nutrition Analytics</h2>
              <p className="text-purple-100">Powered by advanced AI analysis</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Timeframe selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => onTimeframeChange(period)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeframe === period
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={loadAnalysisData}
              disabled={loading}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={generateReport}
              className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2 hover:bg-white/30 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium text-gray-600">Analyzing your nutrition data...</span>
          </div>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.overallScore / 100)}`}
                      className={`${getScoreColor(analysis.overallScore)} transition-all duration-1000`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}
                      </div>
                      <div className="text-sm text-gray-500">Score</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-800">Nutrition Score</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on AI analysis of your {timeframe} nutrition data
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Macro Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                  Macro Distribution
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  {macroChartData && <Pie data={macroChartData} options={{ maintainAspectRatio: false }} />}
                </div>

                <div className="space-y-4">
                  {Object.entries(analysis.macroAnalysis).map(([macro, data]) => (
                    <div key={macro} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800 capitalize">{macro}</div>
                        <div className="text-sm text-gray-600">{data.current}g / {data.target}g</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        data.status === 'optimal' ? 'bg-green-100 text-green-800' :
                        data.status === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {data.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hydration Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                Hydration Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48">
                  <Bar data={hydrationData} options={{ maintainAspectRatio: false }} />
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      analysis.hydrationAnalysis.status === 'optimal' ? 'text-green-600' :
                      analysis.hydrationAnalysis.status === 'dehydrated' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {Math.round((analysis.hydrationAnalysis.averageIntake / analysis.hydrationAnalysis.target) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Hydration Goal</div>
                    <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                      analysis.hydrationAnalysis.status === 'optimal' ? 'bg-green-100 text-green-800' :
                      analysis.hydrationAnalysis.status === 'dehydrated' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {analysis.hydrationAnalysis.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calories Trend */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Calories Trend
              </h3>

              <div className="h-64">
                <Line data={caloriesTrendData} options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} />
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Analysis Available</h3>
          <p className="text-gray-600 mb-4">Click the refresh button to generate your AI nutrition analysis.</p>
          <button
            onClick={loadAnalysisData}
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Analysis</span>
          </button>
        </div>
      )}
    </div>
  );
};
