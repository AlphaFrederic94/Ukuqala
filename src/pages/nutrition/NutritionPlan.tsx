import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MealManager } from '@/components/nutrition/MealManager';
import { WaterTracker } from '@/components/nutrition/WaterTracker';
import { nutritionProgramService, NutritionPlan as NPlan } from '@/lib/nutritionProgramService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import { Utensils, Droplet, Calendar, PieChart, Plus, ArrowRight, Award, Zap, Clipboard, AlertTriangle } from 'lucide-react';

const NutritionPlan: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<NPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadActivePlan();
    }
  }, [user]);

  const loadActivePlan = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const plan = await nutritionProgramService.getActivePlan(user.id);
      setActivePlan(plan);
    } catch (error) {
      console.error('Error loading nutrition plan:', error);
      toast({
        title: "Error",
        description: "Failed to load nutrition plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    navigate('/nutrition/create-plan'); // Ensure this route exists in your App.tsx
  };

  const renderNutritionSummary = () => {
    if (!activePlan) return null;

    // Calculate total macros in grams
    const totalMacros = activePlan.macros.protein + activePlan.macros.carbs + activePlan.macros.fats;

    // Calculate percentages for the chart
    const proteinPercentage = Math.round((activePlan.macros.protein / totalMacros) * 100);
    const carbsPercentage = Math.round((activePlan.macros.carbs / totalMacros) * 100);
    const fatsPercentage = Math.round((activePlan.macros.fats / totalMacros) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-white flex items-center">
            <Award className="h-6 w-6 mr-2 text-blue-500" />
            Daily Nutrition Goals
          </h2>
          <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
            Goal: <span className="font-medium capitalize">{activePlan.goal.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Macro distribution chart */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Macro Distribution</h3>
            <div className="relative w-48 h-48">
              {/* Circular chart background */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#f3f4f6" className="dark:fill-gray-600" />

                {/* Protein segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#22c55e"
                  strokeWidth="10"
                  strokeDasharray={`${proteinPercentage * 2.83} ${283 - (proteinPercentage * 2.83)}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />

                {/* Carbs segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#eab308"
                  strokeWidth="10"
                  strokeDasharray={`${carbsPercentage * 2.83} ${283 - (carbsPercentage * 2.83)}`}
                  strokeDashoffset={`${-proteinPercentage * 2.83}`}
                  transform="rotate(-90 50 50)"
                />

                {/* Fats segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="10"
                  strokeDasharray={`${fatsPercentage * 2.83} ${283 - (fatsPercentage * 2.83)}`}
                  strokeDashoffset={`${-(proteinPercentage + carbsPercentage) * 2.83}`}
                  transform="rotate(-90 50 50)"
                />

                {/* Center text */}
                <text x="50" y="45" textAnchor="middle" className="text-2xl font-bold fill-gray-800 dark:fill-white">
                  {activePlan.daily_calories}
                </text>
                <text x="50" y="60" textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400">
                  kcal/day
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Protein</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Carbs</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Fats</span>
              </div>
            </div>
          </div>

          {/* Macro details */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -5 }}
              className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex flex-col items-center justify-center"
            >
              <div className="text-blue-500 mb-2">
                <PieChart className="h-8 w-8" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Daily Calories</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{activePlan.daily_calories}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">kcal</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="p-5 bg-green-50 dark:bg-green-900/20 rounded-xl flex flex-col items-center justify-center"
            >
              <div className="text-green-500 mb-2">
                <Zap className="h-8 w-8" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Protein</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{activePlan.macros.protein}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">grams ({proteinPercentage}%)</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="p-5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex flex-col items-center justify-center"
            >
              <div className="text-yellow-500 mb-2">
                <Clipboard className="h-8 w-8" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carbs</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{activePlan.macros.carbs}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">grams ({carbsPercentage}%)</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl flex flex-col items-center justify-center"
            >
              <div className="text-red-500 mb-2">
                <Droplet className="h-8 w-8" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fats</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{activePlan.macros.fats}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">grams ({fatsPercentage}%)</div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMealSchedule = () => {
    if (!activePlan?.meal_plan) return null;

    // Define meal icons and colors based on meal type
    const getMealIcon = (type) => {
      const lowerType = type.toLowerCase();
      if (lowerType.includes('breakfast')) return { icon: <Utensils className="h-5 w-5 text-yellow-500" />, color: 'yellow' };
      if (lowerType.includes('lunch')) return { icon: <Utensils className="h-5 w-5 text-green-500" />, color: 'green' };
      if (lowerType.includes('dinner')) return { icon: <Utensils className="h-5 w-5 text-blue-500" />, color: 'blue' };
      if (lowerType.includes('snack')) return { icon: <Utensils className="h-5 w-5 text-purple-500" />, color: 'purple' };
      return { icon: <Utensils className="h-5 w-5 text-gray-500" />, color: 'gray' };
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-white flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-500" />
            Recommended Meal Schedule
          </h2>
          <button
            onClick={() => navigate('/nutrition/meal-planner')}
            className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center"
          >
            Customize <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePlan.meal_plan.map((meal, index) => {
            const { icon, color } = getMealIcon(meal.type);
            return (
              <motion.div
                key={`meal-${index}`}
                whileHover={{ y: -5 }}
                className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl overflow-hidden shadow-sm border border-${color}-100 dark:border-${color}-900/30`}
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    {icon}
                    <div className="ml-2">
                      <div className="font-semibold capitalize dark:text-white">{meal.type}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{meal.time}</div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200">
                    {meal.calories} kcal
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Suggested Foods:</h4>
                  <div className="space-y-2">
                    {meal.foods.map((food, foodIndex) => (
                      <div key={foodIndex} className="flex items-start">
                        <div className={`h-5 w-5 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 mr-2`}>
                          {foodIndex + 1}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{food}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your nutrition plan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {activePlan ? (
        <>
          {/* Hero section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden mb-8">
            <div className="px-8 py-10 md:py-12 relative">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <pattern id="nutrition-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100" height="100" fill="url(#nutrition-grid)"/>
                </svg>
              </div>

              <div className="relative z-10 max-w-3xl">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-bold text-white mb-2 flex items-center"
                >
                  Your Nutrition Plan
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-blue-100 mb-6"
                >
                  Personalized nutrition recommendations to help you achieve your health goals.
                </motion.p>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleCreatePlan}
                    className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    Update Plan
                  </button>

                  <button
                    onClick={() => navigate('/nutrition/meal-planner')}
                    className="px-4 py-2 bg-blue-500/30 text-white rounded-lg hover:bg-blue-500/50 transition-colors flex items-center"
                  >
                    <Utensils className="h-4 w-4 mr-2" />
                    Meal Planner
                  </button>
                </div>
              </div>
            </div>
          </div>

          {renderNutritionSummary()}
          {renderMealSchedule()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center">
                <Utensils className="h-6 w-6 mr-2 text-blue-500" />
                Meal Tracking
              </h2>
              <MealManager onUpdate={loadActivePlan} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center">
                <Droplet className="h-6 w-6 mr-2 text-blue-500" />
                Water Tracking
              </h2>
              <WaterTracker />
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center max-w-2xl mx-auto border border-gray-100 dark:border-gray-700"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4 dark:text-white">No Nutrition Plan Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">You don't have an active nutrition plan yet. Create a personalized plan to track your nutrition goals and improve your health.</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreatePlan}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Nutrition Plan
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default NutritionPlan;
