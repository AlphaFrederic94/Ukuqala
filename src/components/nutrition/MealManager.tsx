import React, { useState, useEffect } from 'react';
import { nutritionService } from '@/lib/nutritionService';
import { FoodItem, NutritionLog, MealReminder } from '@/types/nutrition';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { notificationService } from '@/services/notificationService';
import { Plus } from 'lucide-react';
import { AddMealModal } from './AddMealModal';
import { MealHistory } from './MealHistory';
import { PREDEFINED_MEALS } from '@/constants/predefinedMeals';

interface MealManagerProps {
  onUpdate?: () => void;
}

export const MealManager: React.FC<MealManagerProps> = ({ onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState<NutritionLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [showPredefinedMeals, setShowPredefinedMeals] = useState(false);
  const [mealReminder, setMealReminder] = useState<MealReminder | null>(null);
  const [predefinedMealsForType, setPredefinedMealsForType] = useState<FoodItem[]>([]);
  const [filteredCustomFoods, setFilteredCustomFoods] = useState<FoodItem[]>([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  useEffect(() => {
    if (user) {
      loadTodayLogs();
      loadCustomFoods();
    }
  }, [user, selectedMealType]);

  useEffect(() => {
    // Update predefined meals when meal type changes
    const meals = PREDEFINED_MEALS[selectedMealType] || [];
    setPredefinedMealsForType(meals);
  }, [selectedMealType]);

  useEffect(() => {
    // Filter custom foods by meal type
    const filtered = customFoods.filter(
      food => food.category === selectedMealType || food.category === 'custom'
    );
    setFilteredCustomFoods(filtered);
  }, [customFoods, selectedMealType]);

  const loadTodayLogs = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await nutritionService.getDailyLogs(user.id, today);
      setTodayLogs(logs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: "Error",
        description: "Failed to load nutrition logs",
        variant: "destructive"
      });
    }
  };

  const loadCustomFoods = async () => {
    if (!user) return;
    try {
      const foods = await nutritionService.getUserCustomFoods(user.id);
      setCustomFoods(foods);
    } catch (error) {
      console.error('Error loading custom foods:', error);
      toast({
        title: "Error",
        description: "Failed to load custom foods",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await nutritionService.searchFoods(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching foods:', error);
      toast({
        title: "Error",
        description: "Failed to search foods",
        variant: "destructive"
      });
    }
  };

  const handleAddFood = async (food: FoodItem) => {
    if (!user) return;

    try {
      setLoading(true);
      await nutritionService.addFoodToMeal(user.id, selectedMealType, {
        ...food,
        category: selectedMealType // Ensure category matches meal type
      });
      await loadTodayLogs();
      await loadCustomFoods(); // Reload custom foods after adding
      setSearchTerm('');
      setSearchResults([]);

      // Show success toast with more details
      toast({
        title: "Meal Added Successfully",
        description: `${food.name} (${food.calories} cal) added to your ${selectedMealType}`
      });

      // Show a temporary success message in the UI
      const successElement = document.createElement('div');
      successElement.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 animate-fade-in-out';
      successElement.innerHTML = `
        <div class="flex items-center">
          <svg class="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <p><span class="font-bold">${food.name}</span> added to your custom meals</p>
        </div>
      `;
      document.body.appendChild(successElement);

      // Remove the success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successElement)) {
          document.body.removeChild(successElement);
        }
      }, 3000);

      onUpdate?.();
    } catch (error) {
      console.error('Error adding food:', error);
      toast({
        title: "Error",
        description: "Failed to add food",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFood = async (logId: string, foodIndex: number) => {
    try {
      setLoading(true);
      await nutritionService.removeFoodFromMeal(logId, foodIndex);
      await loadTodayLogs();
      toast({
        title: "Success",
        description: "Food removed successfully"
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error removing food:', error);
      toast({
        title: "Error",
        description: "Failed to remove food",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetMealReminder = async (mealType: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Request notification permission using our service
      const permissionGranted = await notificationService.requestPermission();
      if (!permissionGranted) {
        toast({
          title: "Error",
          description: "Please enable notifications to set reminders",
          variant: "destructive"
        });
        return;
      }

      const reminder: Omit<MealReminder, 'id'> = {
        user_id: user.id,
        meal_type: mealType,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        frequency: 'daily',
        is_active: true,
        notification_type: 'push',
        custom_days: [0,1,2,3,4,5,6] // All days of the week
      };

      const newReminder = await nutritionService.setMealReminder(user.id, reminder);
      setMealReminder(newReminder);

      // Show a test notification
      notificationService.showNotification({
        title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Reminder Set`,
        body: `You'll receive a reminder for ${mealType} at ${reminder.time} daily.`,
        sound: 'meal',
        onClick: () => window.focus()
      });

      toast({
        title: "Success",
        description: `Reminder set for ${mealType}`
      });

    } catch (error) {
      console.error('Error setting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to set reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  const renderPredefinedMeals = () => (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold dark:text-white">Suggested Meals</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {predefinedMealsForType.length} suggestions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predefinedMealsForType.map((meal, index) => (
          <div
            key={index}
            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-100 dark:border-blue-800 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900 dark:text-white">{meal.name}</h4>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {meal.calories} cal
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                Protein: {meal.protein}g
              </span>
              <span className="text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                Carbs: {meal.carbs}g
              </span>
              <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                Fat: {meal.fat}g
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => handleAddFood({...meal, category: selectedMealType})}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Meal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomFoods = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">My Custom Foods</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {filteredCustomFoods.length} items
        </span>
      </div>

      {filteredCustomFoods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomFoods.map((food, index) => (
            <div
              key={food.id || index}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleAddFood(food)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900 dark:text-white">{food.name}</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {food.calories} cal
                </span>
              </div>
              <div className="mt-2 flex space-x-3">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  Protein: {food.protein}g
                </span>
                <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                  Carbs: {food.carbs}g
                </span>
                <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                  Fat: {food.fat}g
                </span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Category: <span className="capitalize">{food.category}</span>
                </p>
                <button
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFood(food);
                  }}
                >
                  Add to Meal
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No custom foods found for this meal type.</p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            Add foods to your meal to see them here.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {mealTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedMealType(type)}
              className={`px-4 py-2 rounded-lg ${
                selectedMealType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddMealModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Meal
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <MealHistory />
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search foods..."
            className="w-full px-4 py-2 border rounded-lg"
          />

          {searchTerm && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Search Results</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {searchResults.length} results
                </span>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((food, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleAddFood({...food, category: selectedMealType})}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 dark:text-white">{food.name}</h4>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {food.calories} cal
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Protein: {food.protein}g
                        </span>
                        <span className="text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                          Carbs: {food.carbs}g
                        </span>
                        <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                          Fat: {food.fat}g
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFood({...food, category: selectedMealType});
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Meal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No results found for "{searchTerm}"</p>
                  <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
                    Try a different search term or add a custom food.
                  </p>
                </div>
              )}
            </div>
          )}

          {renderCustomFoods()}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Today's {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}</h3>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {todayLogs.filter(log => log.meal_type === selectedMealType).reduce((total, log) => total + log.food_items.length, 0)} items
                </span>
                <button
                  onClick={() => {
                    // Focus the search input
                    const searchInput = document.querySelector('input[placeholder="Search foods..."]') as HTMLInputElement;
                    if (searchInput) searchInput.focus();
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Food
                </button>
              </div>
            </div>

            {todayLogs.filter(log => log.meal_type === selectedMealType).length > 0 ? (
              <div className="space-y-4">
                {todayLogs
                  .filter(log => log.meal_type === selectedMealType)
                  .map((log) => (
                    <div key={log.id} className="space-y-3">
                      {log.food_items.map((food, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-sm transition-all"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{food.name}</h3>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                {food.calories} cal
                              </span>
                              <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                P: {food.protein}g
                              </span>
                              <span className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
                                C: {food.carbs}g
                              </span>
                              <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                                F: {food.fat}g
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFood(log.id, idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Foods Added Yet</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Search for foods or add a custom meal to get started.</p>
                <button
                  onClick={() => {
                    // Focus the search input
                    const searchInput = document.querySelector('input[placeholder="Search foods..."]') as HTMLInputElement;
                    if (searchInput) searchInput.focus();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Food
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showPredefinedMeals && renderPredefinedMeals()}

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={showAddMealModal}
        onClose={() => setShowAddMealModal(false)}
        onAdd={handleAddFood}
        initialMealType={selectedMealType}
      />
    </div>
  );
};
