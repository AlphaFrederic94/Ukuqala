import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Utensils, Check } from 'lucide-react';
import { FoodItem } from '@/types/nutrition';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { nutritionService } from '@/lib/nutritionService';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (food: FoodItem, mealType: string) => void;
  initialMealType?: string;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({ isOpen, onClose, onAdd, initialMealType = 'breakfast' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [food, setFood] = useState<FoodItem>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [selectedMealType, setSelectedMealType] = useState(initialMealType);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleAddFoodItem = () => {
    if (!food.name) {
      toast({
        title: "Error",
        description: "Food name is required",
        variant: "destructive"
      });
      return;
    }

    setFoodItems([...foodItems, { ...food, id: `temp-${Date.now()}` }]);
    setFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
  };

  const handleRemoveFoodItem = (index: number) => {
    const updatedItems = [...foodItems];
    updatedItems.splice(index, 1);
    setFoodItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add meals",
        variant: "destructive"
      });
      return;
    }

    if (foodItems.length === 0) {
      // If no items have been added to the list, add the current food item
      if (food.name) {
        setFoodItems([{ ...food, id: `temp-${Date.now()}` }]);
        // Use the current food item directly
        onAdd(food, selectedMealType);
        onClose();
        return;
      }

      toast({
        title: "Error",
        description: "Please add at least one food item",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate total macros
      const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);

      // Create the meal log
      await nutritionService.createMealLog(user.id, {
        meal_type: selectedMealType,
        food_items: foodItems,
        calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat
      });

      toast({
        title: "Success",
        description: `${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} added successfully!`
      });

      // Show a temporary success message in the UI
      const successElement = document.createElement('div');
      successElement.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 animate-fade-in-out';
      successElement.innerHTML = `
        <div class="flex items-center">
          <svg class="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <p><span class="font-bold">${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}</span> added to your meal history</p>
        </div>
      `;
      document.body.appendChild(successElement);

      // Remove the success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successElement)) {
          document.body.removeChild(successElement);
        }
      }, 3000);

      // Call the onAdd callback with the first food item (for backward compatibility)
      if (foodItems.length > 0) {
        onAdd(foodItems[0], selectedMealType);
      }

      onClose();
    } catch (error) {
      console.error('Error adding meal:', error);
      toast({
        title: "Error",
        description: "Failed to add meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white flex items-center">
                <Utensils className="h-6 w-6 mr-2 text-green-500" />
                Add New {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meal Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meal Type</label>
                <div className="flex flex-wrap gap-2">
                  {mealTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedMealType(type)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedMealType === type
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food items list */}
              {foodItems.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium mb-3 dark:text-white">Added Food Items</h3>
                  <div className="space-y-3">
                    {foodItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg shadow-sm"
                      >
                        <div>
                          <h4 className="font-medium dark:text-white">{item.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                              {item.calories} cal
                            </span>
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              P: {item.protein}g
                            </span>
                            <span className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
                              C: {item.carbs}g
                            </span>
                            <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                              F: {item.fat}g
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFoodItem(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300">Meal Totals</h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {foodItems.reduce((sum, item) => sum + item.calories, 0)} calories
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mt-1">
                      <span>Protein: {foodItems.reduce((sum, item) => sum + item.protein, 0)}g</span>
                      <span>Carbs: {foodItems.reduce((sum, item) => sum + item.carbs, 0)}g</span>
                      <span>Fat: {foodItems.reduce((sum, item) => sum + item.fat, 0)}g</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Add new food form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-medium mb-4 dark:text-white">Add Food Item</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Food Name
                    </label>
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) => setFood({ ...food, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. Grilled Chicken"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={food.calories}
                      onChange={(e) => setFood({ ...food, calories: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. 200"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={food.protein}
                      onChange={(e) => setFood({ ...food, protein: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. 25"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={food.carbs}
                      onChange={(e) => setFood({ ...food, carbs: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. 30"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={food.fat}
                      onChange={(e) => setFood({ ...food, fat: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. 10"
                      min="0"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddFoodItem}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Food Item
                </button>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || (foodItems.length === 0 && !food.name)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Save Meal
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
