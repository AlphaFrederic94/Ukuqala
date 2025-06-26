import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Brain,
  Calendar,
  Activity,
  Zap
} from 'lucide-react';
import { NutritionAnalysisResponse } from '@/lib/aiNutritionService';

interface NutritionInsightsProps {
  analysis: NutritionAnalysisResponse | null;
  loading?: boolean;
}

export const NutritionInsights: React.FC<NutritionInsightsProps> = ({ analysis, loading }) => {
  const [selectedInsight, setSelectedInsight] = useState<number>(0);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  const getInsightType = (insight: string): string => {
    if (insight.toLowerCase().includes('great') || insight.toLowerCase().includes('excellent')) {
      return 'achievement';
    }
    if (insight.toLowerCase().includes('low') || insight.toLowerCase().includes('deficient')) {
      return 'warning';
    }
    if (insight.toLowerCase().includes('trend') || insight.toLowerCase().includes('increasing')) {
      return 'trend';
    }
    return 'recommendation';
  };

  const getRecommendationPriority = (recommendation: string): 'high' | 'medium' | 'low' => {
    if (recommendation.toLowerCase().includes('immediately') || recommendation.toLowerCase().includes('urgent')) {
      return 'high';
    }
    if (recommendation.toLowerCase().includes('consider') || recommendation.toLowerCase().includes('try')) {
      return 'medium';
    }
    return 'low';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Insights Available</h3>
          <p className="text-gray-600">Generate an AI analysis to see personalized nutrition insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-500" />
            AI Insights
          </h3>
          <div className="text-sm text-gray-500">
            {analysis.insights.length} insights found
          </div>
        </div>

        <div className="space-y-3">
          {analysis.insights.map((insight, index) => {
            const type = getInsightType(insight);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setSelectedInsight(index)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{insight}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
          <Target className="h-5 w-5 mr-2 text-blue-500" />
          Personalized Recommendations
        </h3>

        <div className="space-y-3">
          {analysis.recommendations.map((recommendation, index) => {
            const priority = getRecommendationPriority(recommendation);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 mb-2">{recommendation}</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority)}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Trends Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
          <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
          Nutrition Trends
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Calories</span>
              {getTrendIcon(analysis.trends.caloriesTrend)}
            </div>
            <div className="text-lg font-bold text-blue-600 capitalize">
              {analysis.trends.caloriesTrend}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {analysis.trends.caloriesTrend === 'increasing' ? 'Calorie intake is rising' :
               analysis.trends.caloriesTrend === 'decreasing' ? 'Calorie intake is declining' :
               'Calorie intake is consistent'}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Hydration</span>
              {getTrendIcon(analysis.trends.hydrationTrend)}
            </div>
            <div className="text-lg font-bold text-green-600 capitalize">
              {analysis.trends.hydrationTrend}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {analysis.trends.hydrationTrend === 'improving' ? 'Water intake is improving' :
               analysis.trends.hydrationTrend === 'declining' ? 'Water intake needs attention' :
               'Hydration levels are stable'}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Macro Balance</span>
              {getTrendIcon(analysis.trends.macroBalance)}
            </div>
            <div className="text-lg font-bold text-purple-600 capitalize">
              {analysis.trends.macroBalance}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {analysis.trends.macroBalance === 'improving' ? 'Macro distribution is getting better' :
               analysis.trends.macroBalance === 'declining' ? 'Macro balance needs work' :
               'Macro ratios are consistent'}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Recommendations */}
      {analysis.mealRecommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
            <Zap className="h-5 w-5 mr-2 text-orange-500" />
            Smart Meal Suggestions
          </h3>

          <div className="space-y-4">
            {analysis.mealRecommendations.map((mealRec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 capitalize">{mealRec.mealType}</h4>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">{mealRec.reasoning}</p>
                  <div className="flex flex-wrap gap-2">
                    {mealRec.suggestions.map((suggestion, suggestionIndex) => (
                      <span
                        key={suggestionIndex}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                      >
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
