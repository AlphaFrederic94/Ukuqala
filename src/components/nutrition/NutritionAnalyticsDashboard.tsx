import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { nutritionService } from '@/lib/nutritionService';

interface NutritionAnalyticsDashboardProps {
  userId: string;
}

interface AnalyticsData {
  dailyTrends: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  }>;
  macroDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  weeklyAverages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
}

export const NutritionAnalyticsDashboard: React.FC<NutritionAnalyticsDashboardProps> = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | '3months'>('week');
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'trends' | 'macros' | 'water'>('trends');

  useEffect(() => {
    loadAnalyticsData();
  }, [userId, timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Get nutrition data
      const [mealLogs, waterLogs] = await Promise.all([
        nutritionService.getMealHistory(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
        nutritionService.getWaterLogs(userId, 100) // Get more water logs
      ]);

      // Process data for charts
      const processedData = processNutritionData(mealLogs, waterLogs, startDate, endDate);
      setAnalyticsData(processedData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processNutritionData = (mealLogs: any[], waterLogs: any[], startDate: Date, endDate: Date): AnalyticsData => {
    // Group data by date
    const dateMap = new Map();
    
    // Initialize dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process meal logs
    mealLogs.forEach(log => {
      const date = log.logged_at?.split('T')[0];
      if (dateMap.has(date)) {
        const dayData = dateMap.get(date);
        dayData.calories += log.calories || 0;
        dayData.protein += log.protein || 0;
        dayData.carbs += log.carbs || 0;
        dayData.fat += log.fat || 0;
      }
    });

    // Process water logs
    waterLogs.forEach(log => {
      const date = log.logged_at?.split('T')[0];
      if (dateMap.has(date)) {
        const dayData = dateMap.get(date);
        dayData.water += log.amount_ml || 0;
      }
    });

    const dailyTrends = Array.from(dateMap.values());

    // Calculate macro distribution (average)
    const totalCalories = dailyTrends.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = dailyTrends.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = dailyTrends.reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = dailyTrends.reduce((sum, day) => sum + day.fat, 0);

    const macroDistribution = [
      { name: 'Protein', value: totalProtein * 4, color: '#ef4444' },
      { name: 'Carbs', value: totalCarbs * 4, color: '#3b82f6' },
      { name: 'Fat', value: totalFat * 9, color: '#f59e0b' }
    ];

    // Calculate weekly averages
    const days = dailyTrends.length || 1;
    const weeklyAverages = {
      calories: totalCalories / days,
      protein: totalProtein / days,
      carbs: totalCarbs / days,
      fat: totalFat / days,
      water: dailyTrends.reduce((sum, day) => sum + day.water, 0) / days
    };

    return {
      dailyTrends,
      macroDistribution,
      weeklyAverages
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
        <p className="text-gray-500 dark:text-gray-400">Start tracking your nutrition to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition Analytics</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Last {timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : '3 months'}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {['week', 'month', '3months'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period === '3months' ? '3 Months' : period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex space-x-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-1">
        {[
          { id: 'trends', label: 'Daily Trends', icon: TrendingUp },
          { id: 'macros', label: 'Macro Distribution', icon: PieChartIcon },
          { id: 'water', label: 'Hydration', icon: Activity }
        ].map((chart) => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeChart === chart.id
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <chart.icon className="h-4 w-4" />
            <span>{chart.label}</span>
          </button>
        ))}
      </div>

      {/* Charts */}
      <motion.div
        key={activeChart}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        {activeChart === 'trends' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Daily Nutrition Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#caloriesGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'macros' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Macronutrient Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.macroDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value)} cal`, 'Calories']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Average Daily Intake</h4>
                {[
                  { name: 'Protein', value: analyticsData.weeklyAverages.protein, unit: 'g', color: '#ef4444' },
                  { name: 'Carbs', value: analyticsData.weeklyAverages.carbs, unit: 'g', color: '#3b82f6' },
                  { name: 'Fat', value: analyticsData.weeklyAverages.fat, unit: 'g', color: '#f59e0b' }
                ].map((macro) => (
                  <div key={macro.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: macro.color }} />
                      <span className="font-medium text-gray-900 dark:text-white">{macro.name}</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {Math.round(macro.value)}{macro.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeChart === 'water' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Hydration Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`${value}ml`, 'Water Intake']}
                  />
                  <Bar 
                    dataKey="water" 
                    fill="url(#waterGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Average Daily Intake
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(analyticsData.weeklyAverages.water)}ml
                </span>
              </div>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Recommended: 2000ml per day
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NutritionAnalyticsDashboard;
