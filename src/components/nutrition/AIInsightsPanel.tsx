import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Activity,
  Heart,
  Zap,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { NutritionAnalysisResponse } from '@/lib/aiNutritionService';

interface AIInsightsPanelProps {
  analysis: NutritionAnalysisResponse | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  analysis, 
  loading, 
  onRefresh 
}) => {
  const [activeInsight, setActiveInsight] = useState<number>(0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Nutrition Insights</h2>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI Analysis Available</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Track your nutrition for a few days to get personalized AI insights
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Analysis</span>
          </button>
        )}
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return AlertTriangle;
  };

  const ScoreIcon = getScoreIcon(analysis.overallScore);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Nutrition Insights</h2>
            <p className="text-gray-500 dark:text-gray-400">Powered by advanced nutrition analysis</p>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-r ${getScoreColor(analysis.overallScore)} rounded-2xl p-8 text-white`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Overall Nutrition Score</h3>
            <div className="flex items-center space-x-4">
              <div className="text-5xl font-bold">{analysis.overallScore}</div>
              <div className="text-white/80">
                <div className="text-sm">out of 100</div>
                <div className="text-xs">
                  {analysis.overallScore >= 80 ? 'Excellent!' : 
                   analysis.overallScore >= 60 ? 'Good progress' : 'Needs improvement'}
                </div>
              </div>
            </div>
          </div>
          <ScoreIcon className="h-16 w-16 text-white/80" />
        </div>
      </motion.div>

      {/* Macro Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(analysis.macroAnalysis).map(([macro, data], index) => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'optimal': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
              case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
              case 'low': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
              default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
            }
          };

          const getStatusIcon = (status: string) => {
            switch (status) {
              case 'optimal': return CheckCircle;
              case 'high': return TrendingUp;
              case 'low': return AlertTriangle;
              default: return Activity;
            }
          };

          const StatusIcon = getStatusIcon(data.status);

          return (
            <motion.div
              key={macro}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{macro}</h4>
                <div className={`p-2 rounded-lg ${getStatusColor(data.status)}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current</span>
                  <span className="font-medium text-gray-900 dark:text-white">{data.current}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Target</span>
                  <span className="font-medium text-gray-900 dark:text-white">{data.target}g</span>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-500">{Math.round((data.current / data.target) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((data.current / data.target) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-2 rounded-full ${
                        data.status === 'optimal' ? 'bg-green-500' :
                        data.status === 'high' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hydration Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hydration Status</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {analysis.hydrationAnalysis.averageIntake}ml
            </div>
            <div className="text-sm text-gray-500">Average Daily</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {analysis.hydrationAnalysis.target}ml
            </div>
            <div className="text-sm text-gray-500">Daily Target</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              analysis.hydrationAnalysis.status === 'optimal' ? 'text-green-500' :
              analysis.hydrationAnalysis.status === 'dehydrated' ? 'text-red-500' : 'text-orange-500'
            }`}>
              {analysis.hydrationAnalysis.status.charAt(0).toUpperCase() + analysis.hydrationAnalysis.status.slice(1)}
            </div>
            <div className="text-sm text-gray-500">Status</div>
          </div>
        </div>
      </motion.div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Insights</h3>
          </div>
          
          <div className="space-y-4">
            {analysis.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommendations</h3>
          </div>
          
          <div className="space-y-4">
            {analysis.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <ArrowRight className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Meal Recommendations */}
      {analysis.mealRecommendations && analysis.mealRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meal Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.mealRecommendations.map((meal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              >
                <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2 capitalize">
                  {meal.mealType}
                </h4>
                <div className="space-y-2">
                  {meal.suggestions.map((suggestion, suggestionIndex) => (
                    <div key={suggestionIndex} className="text-sm text-gray-700 dark:text-gray-300">
                      • {suggestion}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">
                  {meal.reasoning}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nutrition Trends</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(analysis.trends).map(([trend, status], index) => {
            const getTrendIcon = (status: string) => {
              switch (status) {
                case 'improving': return { icon: TrendingUp, color: 'text-green-500' };
                case 'declining': return { icon: AlertTriangle, color: 'text-red-500' };
                case 'stable': return { icon: Activity, color: 'text-blue-500' };
                default: return { icon: Activity, color: 'text-gray-500' };
              }
            };

            const { icon: TrendIcon, color } = getTrendIcon(status);

            return (
              <motion.div
                key={trend}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <TrendIcon className={`h-8 w-8 ${color} mx-auto mb-2`} />
                <h4 className="font-medium text-gray-900 dark:text-white capitalize mb-1">
                  {trend.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className={`text-sm capitalize ${color}`}>{status}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default AIInsightsPanel;
