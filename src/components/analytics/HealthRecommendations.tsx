import React from 'react';
import { TrendingUp } from 'lucide-react';

interface HealthRecommendationsProps {
  nutritionStats: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
  };
  sleepStats: {
    avgQuality: number;
    avgDuration: number;
    bestDay: string;
    worstDay: string;
  };
  activityStats: {
    avgSteps: number;
    avgActiveMinutes: number;
    avgCaloriesBurned: number;
  };
}

const HealthRecommendations: React.FC<HealthRecommendationsProps> = ({
  nutritionStats,
  sleepStats,
  activityStats
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-lg p-8 text-white mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Personalized Health Recommendations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-medium mb-2">Nutrition</h3>
          <p className="text-sm">
            {nutritionStats.avgCalories > 2500
              ? 'Consider reducing your calorie intake for better weight management.'
              : nutritionStats.avgCalories < 1500
                ? 'Your calorie intake seems low. Ensure you are getting adequate nutrition.'
                : 'Your calorie intake is within a healthy range. Maintain your balanced diet.'}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-medium mb-2">Sleep</h3>
          <p className="text-sm">
            {sleepStats.avgDuration < 7
              ? 'You need more sleep! Aim for 7-9 hours of quality sleep each night.'
              : sleepStats.avgQuality < 6
                ? 'Work on improving your sleep quality with a consistent sleep schedule.'
                : 'Your sleep patterns look good. Continue your healthy sleep habits.'}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-medium mb-2">Activity</h3>
          <p className="text-sm">
            {activityStats.avgSteps < 7000
              ? 'Try to increase your daily steps. Take short walks throughout the day.'
              : activityStats.avgActiveMinutes < 30
                ? 'Incorporate more active minutes into your day for better health.'
                : 'Your activity level is good. Keep up the active lifestyle!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthRecommendations;
