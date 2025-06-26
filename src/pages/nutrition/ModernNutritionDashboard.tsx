import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  BarChart3,
  PieChart,
  Droplets,
  Utensils,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Plus,
  ShoppingCart,
  Zap,
  Activity,
  Heart,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { aiNutritionService, NutritionAnalysisResponse } from '@/lib/aiNutritionService';
import { nutritionService } from '@/lib/nutritionService';
import { NutritionAnalyticsDashboard } from '@/components/nutrition/NutritionAnalyticsDashboard';
import { AIInsightsPanel } from '@/components/nutrition/AIInsightsPanel';
import { WaterTrackingWidget } from '@/components/nutrition/WaterTrackingWidget';
import { MealCartSystem } from '@/components/nutrition/MealCartSystem';
import { AIMealGenerator } from '@/components/nutrition/AIMealGenerator';
import { useEnhancedToast, EnhancedToast } from '@/components/ui/EnhancedToast';

interface DashboardStats {
  todayCalories: number;
  calorieGoal: number;
  waterIntake: number;
  waterGoal: number;
  macros: {
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
  };
  nutritionScore: number;
  streak: number;
}

export const ModernNutritionDashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useEnhancedToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ai-insights' | 'meal-generator' | 'water'>('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<NutritionAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get today's nutrition data
      const today = new Date().toISOString().split('T')[0];
      const [mealLogs, waterLogs] = await Promise.all([
        nutritionService.getMealLogs(user.id, 10),
        nutritionService.getWaterLogs(user.id, 10)
      ]);

      // Calculate dashboard stats
      const todayMeals = mealLogs.filter(log =>
        log.logged_at?.startsWith(today)
      );
      const todayWater = waterLogs.filter(log =>
        log.logged_at?.startsWith(today)
      );

      const stats: DashboardStats = {
        todayCalories: todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
        calorieGoal: 2000, // Should come from user profile
        waterIntake: todayWater.reduce((sum, water) => sum + (water.amount_ml || 0), 0),
        waterGoal: 2000,
        macros: {
          protein: {
            current: todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
            target: 150
          },
          carbs: {
            current: todayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
            target: 250
          },
          fat: {
            current: todayMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
            target: 67
          }
        },
        nutritionScore: 85, // Will be calculated by AI
        streak: 7 // Days of consistent tracking
      };

      setDashboardStats(stats);

      // Get AI analysis
      try {
        const analysisRequest = {
          userId: user.id,
          timeframe: 'daily' as const,
          mealLogs: todayMeals,
          waterLogs: todayWater,
          userProfile: {
            age: 30, // Should come from user profile
            gender: 'male',
            weight: 70,
            height: 175,
            activityLevel: 'moderate',
            goals: ['weight_maintenance', 'muscle_gain']
          }
        };

        const analysis = await aiNutritionService.analyzeNutrition(analysisRequest);
        setAiAnalysis(analysis);
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCartItems(prev => [...prev, { ...item, id: Date.now() + Math.random() }]);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const confirmCart = async () => {
    if (!user || cartItems.length === 0) return;

    try {
      // Save all cart items to database
      for (const item of cartItems) {
        await nutritionService.logMeal(user.id, {
          meal_type: item.mealType || 'snack',
          food_items: [item],
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0
        });
      }

      // Clear cart and reload data
      setCartItems([]);
      await loadDashboardData();

      // Show success notification
      toast.success(
        'Meals Logged!',
        `Successfully logged ${cartItems.length} meal${cartItems.length !== 1 ? 's' : ''} to your nutrition diary.`
      );

    } catch (error) {
      console.error('Error confirming cart:', error);
      toast.error(
        'Failed to Log Meals',
        'There was an error saving your meals. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Nutrition Hub
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Powered by Advanced Analytics
                  </p>
                </div>
              </div>
            </div>

            {/* Cart Icon */}
            <div className="relative">
              <button
                onClick={() => setActiveTab('overview')}
                className="relative p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'ai-insights', label: 'AI Insights', icon: Brain },
            { id: 'meal-generator', label: 'Meal Generator', icon: Utensils },
            { id: 'water', label: 'Hydration', icon: Droplets }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                stats={dashboardStats}
                cartItems={cartItems}
                onRemoveFromCart={removeFromCart}
                onConfirmCart={confirmCart}
              />
            )}
            {activeTab === 'analytics' && (
              <NutritionAnalyticsDashboard userId={user?.id || ''} />
            )}
            {activeTab === 'ai-insights' && (
              <AIInsightsPanel analysis={aiAnalysis} loading={!aiAnalysis} />
            )}
            {activeTab === 'meal-generator' && (
              <AIMealGenerator onAddToCart={addToCart} />
            )}
            {activeTab === 'water' && (
              <WaterTrackingWidget
                currentIntake={dashboardStats?.waterIntake || 0}
                goal={dashboardStats?.waterGoal || 2000}
                onUpdate={loadDashboardData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cart System */}
      <MealCartSystem
        items={cartItems}
        onRemoveItem={removeFromCart}
        onConfirm={confirmCart}
        isVisible={cartItems.length > 0}
      />

      {/* Toast Notifications */}
      <EnhancedToast toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  stats: DashboardStats | null;
  cartItems: any[];
  onRemoveFromCart: (itemId: string) => void;
  onConfirmCart: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, cartItems, onRemoveFromCart, onConfirmCart }) => {
  if (!stats) return <div>Loading...</div>;

  const calorieProgress = (stats.todayCalories / stats.calorieGoal) * 100;
  const waterProgress = (stats.waterIntake / stats.waterGoal) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* Calorie Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Calories</h3>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-500">{stats.todayCalories} / {stats.calorieGoal}</span>
            </div>
          </div>

          <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(calorieProgress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                calorieProgress > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-blue-500'
              }`}
            />
          </div>

          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {stats.calorieGoal - stats.todayCalories > 0
              ? `${stats.calorieGoal - stats.todayCalories} calories remaining`
              : `${stats.todayCalories - stats.calorieGoal} calories over goal`
            }
          </div>
        </motion.div>

        {/* Macro Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Macronutrients</h3>

          <div className="grid grid-cols-3 gap-6">
            {[
              { name: 'Protein', current: stats.macros.protein.current, target: stats.macros.protein.target, color: 'from-red-500 to-pink-500' },
              { name: 'Carbs', current: stats.macros.carbs.current, target: stats.macros.carbs.target, color: 'from-blue-500 to-cyan-500' },
              { name: 'Fat', current: stats.macros.fat.current, target: stats.macros.fat.target, color: 'from-yellow-500 to-orange-500' }
            ].map((macro) => {
              const progress = (macro.current / macro.target) * 100;
              return (
                <div key={macro.name} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <motion.path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="2"
                        strokeDasharray={`${Math.min(progress, 100)}, 100`}
                        className={`bg-gradient-to-r ${macro.color} text-transparent bg-clip-text`}
                        initial={{ strokeDasharray: "0, 100" }}
                        animate={{ strokeDasharray: `${Math.min(progress, 100)}, 100` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        stroke="url(#gradient)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{macro.name}</h4>
                  <p className="text-sm text-gray-500">{macro.current}g / {macro.target}g</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Nutrition Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Nutrition Score</h3>
            <Award className="h-6 w-6" />
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{stats.nutritionScore}</div>
            <div className="text-green-100">Excellent!</div>
          </div>
        </motion.div>

        {/* Water Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hydration</h3>
            <Droplets className="h-6 w-6 text-blue-500" />
          </div>

          <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(waterProgress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.waterIntake}ml / {stats.waterGoal}ml
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Streak</h3>
            <Zap className="h-6 w-6 text-yellow-500" />
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.streak}</div>
            <div className="text-sm text-gray-500">days in a row</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernNutritionDashboard;
