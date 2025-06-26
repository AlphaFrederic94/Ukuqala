import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ChevronLeft, Plus, Calendar, Search, Filter, Trash2, Edit, MoreHorizontal, X } from 'lucide-react';
import { MealManager } from '@/components/nutrition/MealManager';
import { useAuth } from '@/contexts/AuthContext';
import { nutritionService } from '@/lib/nutritionService';
import { useToast } from '@/components/ui/Toast';

interface MealLog {
  id: string;
  user_id: string;
  meal_type: string;
  meal_time?: string;
  food_items: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    category?: string;
  }>;
  calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  logged_at: string;
  created_at?: string;
}

const Meals: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealLog | null>(null);
  const [showMealDetails, setShowMealDetails] = useState(false);

  useEffect(() => {
    if (user) {
      loadMealLogs();
    }
  }, [user, selectedDate]);

  const loadMealLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Format date to YYYY-MM-DD
      const dateString = selectedDate.toISOString().split('T')[0];

      // Get meal logs for the selected date
      const logs = await nutritionService.getDailyMealLogs(user.id, dateString);
      setMealLogs(logs);
    } catch (error) {
      console.error('Error loading meal logs:', error);
      toast({
        title: "Error",
        description: "Failed to load meal logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    try {
      await nutritionService.deleteMealLog(mealId);
      toast({
        title: "Success",
        description: "Meal deleted successfully"
      });
      loadMealLogs();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast({
        title: "Error",
        description: "Failed to delete meal",
        variant: "destructive"
      });
    }
  };

  const handleEditMeal = (meal: MealLog) => {
    setSelectedMeal(meal);
    setShowAddMeal(true);
  };

  const handleViewMealDetails = (meal: MealLog) => {
    setSelectedMeal(meal);
    setShowMealDetails(true);
  };

  const filteredMealLogs = mealLogs
    .filter(meal => {
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const foodsMatch = meal.food_items ? meal.food_items.some(food => food.name.toLowerCase().includes(searchLower)) : false;
        const typeMatch = meal.meal_type.toLowerCase().includes(searchLower);
        return foodsMatch || typeMatch;
      }
      return true;
    })
    .filter(meal => {
      // Apply meal type filter
      if (filterType) {
        return meal.meal_type.toLowerCase() === filterType.toLowerCase();
      }
      return true;
    });

  // Calculate total calories for the day
  const totalCalories = filteredMealLogs.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = filteredMealLogs.reduce((sum, meal) => sum + meal.total_protein, 0);
  const totalCarbs = filteredMealLogs.reduce((sum, meal) => sum + meal.total_carbs, 0);
  const totalFats = filteredMealLogs.reduce((sum, meal) => sum + meal.total_fat, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl overflow-hidden mb-8">
        <div className="px-8 py-10 md:py-12 relative">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="meals-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#meals-grid)"/>
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl">
            <button
              onClick={() => navigate('/nutrition')}
              className="flex items-center text-green-200 hover:text-white mb-4"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Nutrition Dashboard
            </button>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-white mb-2 flex items-center"
            >
              <Utensils className="h-8 w-8 mr-3" />
              Meal Tracking
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-green-100 mb-6"
            >
              Log and monitor your daily meals and nutritional intake
            </motion.p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Controls section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-xl font-bold dark:text-white">Meals for {selectedDate.toLocaleDateString()}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddMeal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="h-5 w-5 mr-1" />
                Add Meal
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              {/* Date picker */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Meals
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by food or meal type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Type
                </label>
                <div className="relative">
                  <select
                    value={filterType || ''}
                    onChange={(e) => setFilterType(e.target.value || null)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white appearance-none"
                  >
                    <option value="">All meal types</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Daily nutrition summary */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3 dark:text-white">Daily Nutrition Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{totalCalories}</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{totalProtein}g</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{totalCarbs}g</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fats</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{totalFats}g</div>
                </div>
              </div>
            </div>

            {/* Meal logs */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : filteredMealLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredMealLogs.map((meal) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm"
                  >
                    <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-600">
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-white capitalize">{meal.meal_type}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(meal.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800 dark:text-white">{meal.calories} kcal</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          P: {meal.total_protein}g • C: {meal.total_carbs}g • F: {meal.total_fat}g
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        <span className="font-medium">Foods:</span> {meal.food_items ? meal.food_items.map(item => item.name).join(', ') : 'No foods'}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewMealDetails(meal)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditMeal(meal)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">No meals logged</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || filterType
                    ? 'No meals match your search criteria'
                    : 'You haven\'t logged any meals for this date'}
                </p>
                <button
                  onClick={() => setShowAddMeal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Add Your First Meal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meal logging section */}
        <div className="lg:col-span-1">
          <AnimatePresence>
            {showAddMeal && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 sticky top-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">
                    {selectedMeal ? 'Edit Meal' : 'Log a Meal'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddMeal(false);
                      setSelectedMeal(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <MealManager
                  onUpdate={() => {
                    loadMealLogs();
                    setShowAddMeal(false);
                    setSelectedMeal(null);
                  }}
                  initialMeal={selectedMeal}
                  selectedDate={selectedDate}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddMeal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800 sticky top-4"
            >
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Meal Tracking Tips</h3>

              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2 dark:text-white">Track Consistently</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log your meals as soon as possible after eating to ensure accuracy and build a consistent habit.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2 dark:text-white">Be Specific</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Include details like portion sizes and preparation methods for more accurate nutritional tracking.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2 dark:text-white">Plan Ahead</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pre-log your meals for the day to help you stay on track with your nutrition goals.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddMeal(true)}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Log a New Meal
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Meal details modal */}
      <AnimatePresence>
        {showMealDetails && selectedMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowMealDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold dark:text-white">Meal Details</h3>
                <button
                  onClick={() => setShowMealDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Meal Type</div>
                  <div className="text-lg font-medium dark:text-white capitalize">{selectedMeal.meal_type}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                  <div className="dark:text-white">
                    {new Date(selectedMeal.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Foods</div>
                  <ul className="list-disc pl-5 dark:text-white">
                    {selectedMeal.food_items ? selectedMeal.food_items.map((food, index) => (
                      <li key={index}>{food.name || food}</li>
                    )) : <li>No foods available</li>}
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 dark:text-white">Nutritional Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                      <div className="font-medium dark:text-white">{selectedMeal.calories} kcal</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                      <div className="font-medium dark:text-white">{selectedMeal.total_protein} g</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                      <div className="font-medium dark:text-white">{selectedMeal.total_carbs} g</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Fats</div>
                      <div className="font-medium dark:text-white">{selectedMeal.total_fat} g</div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setShowMealDetails(false);
                      handleEditMeal(selectedMeal);
                    }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteMeal(selectedMeal.id);
                      setShowMealDetails(false);
                    }}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Meals;
