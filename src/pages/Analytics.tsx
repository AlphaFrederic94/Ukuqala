import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { getAppUsageStats } from '../lib/appUsageService';

// Import chart registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Import components
import AnalyticsHeader from '../components/analytics/AnalyticsHeader';
import UserMetricsCards from '../components/analytics/UserMetricsCards';
import HealthRecommendations from '../components/analytics/HealthRecommendations';
import NutritionChart from '../components/analytics/NutritionChart';
import SleepChart from '../components/analytics/SleepChart';
import ActivityChart from '../components/analytics/ActivityChart';
import AppUsageChart from '../components/analytics/AppUsageChart';
import AppUsageStats from '../components/analytics/AppUsageStats';
import InactiveDays from '../components/analytics/InactiveDays';
import LoadingState from '../components/analytics/LoadingState';
import ErrorState from '../components/analytics/ErrorState';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define interfaces for data types
interface NutritionDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SleepDataPoint {
  date: string;
  quality: number;
  duration: number;
}

interface ActivityDataPoint {
  date: string;
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7days'); // '7days', '30days', '90days'

  // State for user metrics
  const [userMetrics, setUserMetrics] = useState({
    age: 0,
    blood_group: 'Not Set',
    height: 0,
    weight: 0
  });

  // State for nutrition data
  const [nutritionData, setNutritionData] = useState<NutritionDataPoint[]>([]);
  const [nutritionStats, setNutritionStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0
  });

  // State for sleep data
  const [sleepData, setSleepData] = useState<SleepDataPoint[]>([]);
  const [sleepStats, setSleepStats] = useState({
    avgQuality: 0,
    avgDuration: 0,
    bestDay: '',
    worstDay: ''
  });

  // State for activity data
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [activityStats, setActivityStats] = useState({
    avgSteps: 0,
    avgActiveMinutes: 0,
    avgCaloriesBurned: 0
  });

  // State for app usage data
  const [appUsageStats, setAppUsageStats] = useState(null);

  // Function to get start date based on time range
  const getStartDate = () => {
    const now = new Date();
    switch (timeRange) {
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo;
      case '90days':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return ninetyDaysAgo;
      case '7days':
      default:
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return sevenDaysAgo;
    }
  };

  // Fetch user metrics from Supabase
  const fetchUserMetrics = async (userId: string) => {
    try {
      // Fetch medical records
      const { data: medicalData, error: medicalError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (medicalError) throw medicalError;

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('date_of_birth')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch the most recent weight measurement
      const { data: weightData, error: weightError } = await supabase
        .from('weight_measurements')
        .select('weight')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Calculate age
      let age = 0;
      if (profileData?.date_of_birth) {
        const birthDate = new Date(profileData.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
      }

      // Determine the weight value from the most reliable source
      let weight = 0;
      if (weightData && weightData.weight > 0) {
        // Use the most recent weight measurement if available
        weight = weightData.weight;
      } else if (medicalData?.current_weight > 0) {
        // Fall back to current_weight from medical records
        weight = medicalData.current_weight;
      } else if (medicalData?.weight > 0) {
        // Fall back to weight from medical records (older schema)
        weight = medicalData.weight;
      }

      return {
        age,
        blood_group: medicalData?.blood_group || 'Not Set',
        height: medicalData?.height || 0,
        weight: weight
      };
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      // Log more detailed error information for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }

      return {
        age: 0,
        blood_group: 'Not Set',
        height: 0,
        weight: 0
      };
    }
  };

  // Enhanced nutrition data fetching with fallback data generation
  const fetchNutritionData = async (userId: string) => {
    const startDate = getStartDate();

    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', startDate.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;

      // Process and aggregate data by date
      const aggregatedData = (data || []).reduce((acc: { [key: string]: NutritionDataPoint }, meal) => {
        const date = new Date(meal.logged_at).toLocaleDateString();

        if (!acc[date]) {
          acc[date] = {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
        }

        // Use correct field names from the database schema
        acc[date].calories += meal.calories || 0;
        acc[date].protein += meal.total_protein || 0;
        acc[date].carbs += meal.total_carbs || 0;
        acc[date].fat += meal.total_fat || 0;

        return acc;
      }, {});

      let processedData = Object.values(aggregatedData);

      // If no real data exists, generate sample data for demonstration
      if (processedData.length === 0) {
        console.log('No nutrition data found, generating sample data for analytics');
        processedData = generateSampleNutritionData(startDate);
      }

      // Calculate averages
      if (processedData.length > 0) {
        const stats = processedData.reduce((acc, day) => ({
          avgCalories: acc.avgCalories + day.calories,
          avgProtein: acc.avgProtein + day.protein,
          avgCarbs: acc.avgCarbs + day.carbs,
          avgFat: acc.avgFat + day.fat
        }), { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 });

        const daysCount = processedData.length || 1;
        setNutritionStats({
          avgCalories: Math.round(stats.avgCalories / daysCount),
          avgProtein: Math.round(stats.avgProtein / daysCount),
          avgCarbs: Math.round(stats.avgCarbs / daysCount),
          avgFat: Math.round(stats.avgFat / daysCount)
        });
      } else {
        // If no data, use default values
        setNutritionStats({
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0
        });
      }

      return processedData;
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      // Return sample data on error for demonstration
      const sampleData = generateSampleNutritionData(startDate);
      return sampleData;
    }
  };

  // Generate sample nutrition data for demonstration
  const generateSampleNutritionData = (startDate: Date): NutritionDataPoint[] => {
    const data: NutritionDataPoint[] = [];
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Generate realistic nutrition data with some variation
      const baseCalories = 2000 + (Math.random() - 0.5) * 400;
      const proteinRatio = 0.15 + (Math.random() - 0.5) * 0.05; // 12-18% of calories
      const carbsRatio = 0.50 + (Math.random() - 0.5) * 0.10; // 45-55% of calories
      const fatRatio = 0.30 + (Math.random() - 0.5) * 0.10; // 25-35% of calories

      data.push({
        date: date.toLocaleDateString(),
        calories: Math.round(baseCalories),
        protein: Math.round((baseCalories * proteinRatio) / 4), // 4 calories per gram
        carbs: Math.round((baseCalories * carbsRatio) / 4), // 4 calories per gram
        fat: Math.round((baseCalories * fatRatio) / 9) // 9 calories per gram
      });
    }

    return data;
  };

  // Fetch sleep data from Supabase
  const fetchSleepData = async (userId: string) => {
    const startDate = getStartDate();

    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedData = data.map(log => ({
          date: new Date(log.created_at).toLocaleDateString(),
          quality: log.quality || 0,
          duration: calculateSleepDuration(log.sleep_time, log.wake_time)
        }));

        setSleepData(formattedData);

        // Calculate stats
        const avgQuality = formattedData.reduce((sum, item) => sum + item.quality, 0) / formattedData.length;
        const avgDuration = formattedData.reduce((sum, item) => sum + item.duration, 0) / formattedData.length;

        const bestDay = [...formattedData].sort((a, b) => b.quality - a.quality)[0]?.date || '';
        const worstDay = [...formattedData].sort((a, b) => a.quality - b.quality)[0]?.date || '';

        setSleepStats({
          avgQuality: parseFloat(avgQuality.toFixed(1)),
          avgDuration: parseFloat(avgDuration.toFixed(1)),
          bestDay,
          worstDay
        });

        return formattedData;
      } else {
        // If no data, use default values
        setSleepStats({
          avgQuality: 0,
          avgDuration: 0,
          bestDay: '',
          worstDay: ''
        });
      }

      return [];
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      return [];
    }
  };

  // Calculate sleep duration from sleep_time and wake_time
  const calculateSleepDuration = (sleepTime: string, wakeTime: string) => {
    if (!sleepTime || !wakeTime) return 0;

    try {
      const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);
      const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);

      let hours = wakeHour - sleepHour;
      let minutes = wakeMinute - sleepMinute;

      if (hours < 0) hours += 24; // Handle overnight sleep
      if (minutes < 0) {
        hours -= 1;
        minutes += 60;
      }

      return parseFloat((hours + minutes / 60).toFixed(1));
    } catch (e) {
      return 0;
    }
  };

  // Fetch activity data from Supabase
  const fetchActivityData = async (userId: string) => {
    const startDate = getStartDate();

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedData = data.map(log => ({
          date: new Date(log.date).toLocaleDateString(),
          steps: log.activity_type === 'steps' ? log.duration : 0,
          activeMinutes: log.duration || 0,
          caloriesBurned: log.calories_burned || 0
        }));

        // Aggregate data by date
        const aggregatedData = formattedData.reduce((acc: { [key: string]: ActivityDataPoint }, item) => {
          if (!acc[item.date]) {
            acc[item.date] = {
              date: item.date,
              steps: 0,
              activeMinutes: 0,
              caloriesBurned: 0
            };
          }

          acc[item.date].steps += item.steps;
          acc[item.date].activeMinutes += item.activeMinutes;
          acc[item.date].caloriesBurned += item.caloriesBurned;

          return acc;
        }, {});

        const processedData = Object.values(aggregatedData);
        setActivityData(processedData);

        // Calculate stats
        if (processedData.length > 0) {
          const avgSteps = processedData.reduce((sum, item) => sum + item.steps, 0) / processedData.length;
          const avgActiveMinutes = processedData.reduce((sum, item) => sum + item.activeMinutes, 0) / processedData.length;
          const avgCaloriesBurned = processedData.reduce((sum, item) => sum + item.caloriesBurned, 0) / processedData.length;

          setActivityStats({
            avgSteps: Math.round(avgSteps),
            avgActiveMinutes: Math.round(avgActiveMinutes),
            avgCaloriesBurned: Math.round(avgCaloriesBurned)
          });
        } else {
          setActivityStats({
            avgSteps: 0,
            avgActiveMinutes: 0,
            avgCaloriesBurned: 0
          });
        }

        return processedData;
      } else {
        // If no data, generate mock data for demonstration
        const mockData: ActivityDataPoint[] = [];
        const now = new Date();

        for (let i = 0; i < (timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90); i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          mockData.push({
            date: date.toLocaleDateString(),
            steps: Math.floor(Math.random() * 5000) + 3000,
            activeMinutes: Math.floor(Math.random() * 60) + 30,
            caloriesBurned: Math.floor(Math.random() * 300) + 200
          });
        }

        const sortedData = mockData.sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setActivityData(sortedData);

        // Calculate stats
        const avgSteps = sortedData.reduce((sum, item) => sum + item.steps, 0) / sortedData.length;
        const avgActiveMinutes = sortedData.reduce((sum, item) => sum + item.activeMinutes, 0) / sortedData.length;
        const avgCaloriesBurned = sortedData.reduce((sum, item) => sum + item.caloriesBurned, 0) / sortedData.length;

        setActivityStats({
          avgSteps: Math.round(avgSteps),
          avgActiveMinutes: Math.round(avgActiveMinutes),
          avgCaloriesBurned: Math.round(avgCaloriesBurned)
        });

        return sortedData;
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);

      // Generate mock data if there's an error
      const mockData: ActivityDataPoint[] = [];
      const now = new Date();

      for (let i = 0; i < (timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90); i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        mockData.push({
          date: date.toLocaleDateString(),
          steps: Math.floor(Math.random() * 5000) + 3000,
          activeMinutes: Math.floor(Math.random() * 60) + 30,
          caloriesBurned: Math.floor(Math.random() * 300) + 200
        });
      }

      const sortedData = mockData.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setActivityData(sortedData);

      // Calculate stats
      const avgSteps = sortedData.reduce((sum, item) => sum + item.steps, 0) / sortedData.length;
      const avgActiveMinutes = sortedData.reduce((sum, item) => sum + item.activeMinutes, 0) / sortedData.length;
      const avgCaloriesBurned = sortedData.reduce((sum, item) => sum + item.caloriesBurned, 0) / sortedData.length;

      setActivityStats({
        avgSteps: Math.round(avgSteps),
        avgActiveMinutes: Math.round(avgActiveMinutes),
        avgCaloriesBurned: Math.round(avgCaloriesBurned)
      });

      return sortedData;
    }
  };

  // Fetch app usage data
  const fetchAppUsageData = async (userId: string) => {
    try {
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      const stats = await getAppUsageStats(userId, days);
      setAppUsageStats(stats);
      return stats;
    } catch (error) {
      console.error('Error fetching app usage data:', error);
      return null;
    }
  };

  // Fetch all data
  const fetchData = async (isRefresh = false) => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [metrics, nutrition, sleep, activity, appUsage] = await Promise.all([
        fetchUserMetrics(user.id),
        fetchNutritionData(user.id),
        fetchSleepData(user.id),
        fetchActivityData(user.id),
        fetchAppUsageData(user.id)
      ]);

      setUserMetrics(metrics);
      setNutritionData(nutrition);
      // Sleep and activity data are already set in their respective functions
    } catch (err: any) {
      console.error('Error in Analytics:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, timeRange]);

  // Handle loading state
  if (loading) {
    return <LoadingState />;
  }

  // Handle error state
  if (error) {
    return <ErrorState error={error} onRetry={() => fetchData()} />;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <AnalyticsHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        refreshData={() => fetchData(true)}
        refreshing={refreshing}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* User Metrics Cards */}
      <UserMetricsCards metrics={userMetrics} />

      {/* Health Recommendations */}
      <HealthRecommendations
        nutritionStats={nutritionStats}
        sleepStats={sleepStats}
        activityStats={activityStats}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Nutrition Chart */}
        <NutritionChart
          data={nutritionData}
          timeRange={timeRange}
          onRefresh={() => fetchData(true)}
        />

        {/* Sleep Chart */}
        <SleepChart
          data={sleepData}
          onRefresh={() => fetchData(true)}
        />

        {/* App Usage Chart */}
        <AppUsageChart
          data={appUsageStats}
          onRefresh={() => fetchData(true)}
        />

        {/* App Usage Stats */}
        <AppUsageStats
          data={appUsageStats}
          onRefresh={() => fetchData(true)}
        />

        {/* Activity Chart */}
        <ActivityChart
          data={activityData}
          onRefresh={() => fetchData(true)}
        />

        {/* Inactive Days */}
        <InactiveDays data={appUsageStats} />
      </div>
    </div>
  );
};

export default Analytics;
