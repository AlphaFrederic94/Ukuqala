import React, { useState, useEffect } from 'react';
import { nutritionService } from '@/lib/nutritionService';
import { NutritionLog, FoodItem } from '@/types/nutrition';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { AddMealModal } from './AddMealModal';

export const MealHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [selectedTime, setSelectedTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  useEffect(() => {
    if (user) {
      loadMealHistory();
      loadCustomFoods();
    }
  }, [user, dateRange, selectedMealType]);

  const loadMealHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const history = await nutritionService.getMealHistory(
        user.id,
        dateRange.start,
        dateRange.end
      );
      setMeals(history);
    } catch (error) {
      console.error('Error loading meal history:', error);
      toast.error('Failed to load meal history');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFoods = async () => {
    if (!user) return;
    try {
      const foods = await nutritionService.getUserCustomFoods(user.id);
      setCustomFoods(foods);
    } catch (error) {
      console.error('Error loading custom foods:', error);
      toast.error('Failed to load custom foods');
    }
  };

  const handleAddCustomFood = async (food: FoodItem) => {
    if (!user) return;
    try {
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDate = new Date();
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await nutritionService.addFoodToMeal(user.id, selectedMealType, {
        ...food,
        category: selectedMealType
      }, scheduledDate.toISOString());
      
      toast({
        title: "Success",
        description: "Meal scheduled successfully"
      });
      loadMealHistory();
    } catch (error) {
      console.error('Error scheduling meal:', error);
      toast({
        title: "Error",
        description: "Failed to schedule meal",
        variant: "destructive"
      });
    }
  };

  const filteredMeals = meals.filter(meal => 
    !selectedMealType || meal.meal_type === selectedMealType
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meal History</h2>
        <div className="flex space-x-4">
          <select
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Meals</option>
            {mealTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <button
            onClick={() => setShowAddMealModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Meal
          </button>
        </div>
      </div>

      {/* Meal History Section */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredMeals.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No meals found for the selected period
            </div>
          ) : (
            filteredMeals.map((meal) => (
              <div key={meal.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium capitalize">{meal.meal_type}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(meal.logged_at).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {meal.food_items.map((food, idx) => (
                    <div key={idx} className="text-sm flex justify-between items-center">
                      <div>
                        <span className="font-medium">{food.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g)
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFood(meal.id, idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                  Total: {meal.calories} cal | Protein: {meal.total_protein}g | 
                  Carbs: {meal.total_carbs}g | Fat: {meal.total_fat}g
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom Foods Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-4">Quick Add Custom Foods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customFoods.map((food) => (
            <div 
              key={food.id} 
              className="bg-white p-4 rounded-lg shadow"
            >
              <h4 className="font-medium">{food.name}</h4>
              <p className="text-sm text-gray-500">
                {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="px-2 py-1 border rounded"
                />
                <button
                  onClick={() => handleAddCustomFood(food)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddMealModal
        isOpen={showAddMealModal}
        onClose={() => setShowAddMealModal(false)}
        onAdd={handleAddCustomFood}
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        mealType={selectedMealType}
      />
    </div>
  );
};
