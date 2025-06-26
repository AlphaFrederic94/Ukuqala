import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChefHat,
  Clock,
  Users,
  Zap,
  Heart,
  Leaf,
  Plus,
  Minus,
  ShoppingCart,
  Save,
  RefreshCw,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { aiNutritionService, MealGenerationRequest, GeneratedMeal } from '@/lib/aiNutritionService';
import { nutritionService } from '@/lib/nutritionService';
import { useEnhancedToast } from '@/components/ui/EnhancedToast';

interface AIMealGeneratorProps {
  onAddToCart: (meal: any) => void;
}

export const AIMealGenerator: React.FC<AIMealGeneratorProps> = ({ onAddToCart }) => {
  const { user } = useAuth();
  const toast = useEnhancedToast();
  const [loading, setLoading] = useState(false);
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMeal | null>(null);
  const [preferences, setPreferences] = useState({
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    calorieTarget: 500,
    dietaryRestrictions: [] as string[],
    cuisinePreferences: [] as string[],
    allergies: [] as string[],
    macroTargets: {
      protein: 25,
      carbs: 50,
      fats: 20
    }
  });

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean',
    'Low-carb', 'High-protein', 'Gluten-free', 'Dairy-free'
  ];

  const cuisineOptions = [
    'Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean',
    'American', 'French', 'Thai', 'Japanese', 'Middle Eastern'
  ];

  const allergyOptions = [
    'Nuts', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Shellfish', 'Fish'
  ];

  const generateMeal = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const request: MealGenerationRequest = {
        preferences,
        userProfile: {
          age: 30, // Should come from user profile
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate'
        }
      };

      const meal = await aiNutritionService.generateMealPlan(request);
      setGeneratedMeal(meal);

      toast.aiInsight(
        'Meal Generated!',
        `AI has created a personalized ${preferences.mealType} for you.`,
        [`${meal.nutrition.totalCalories} calories`, `${meal.prepTime} min prep time`]
      );

      // onMealGenerated?.(meal); // Removed since we're using onAddToCart instead
    } catch (error) {
      console.error('Error generating meal:', error);
      toast.error(
        'Generation Failed',
        'Unable to generate meal. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const addMealToCart = () => {
    if (!generatedMeal) return;

    const cartItem = {
      id: Date.now().toString(),
      name: generatedMeal.name,
      calories: generatedMeal.nutrition.totalCalories,
      protein: generatedMeal.nutrition.totalProtein,
      carbs: generatedMeal.nutrition.totalCarbs,
      fat: generatedMeal.nutrition.totalFats,
      mealType: preferences.mealType,
      prepTime: generatedMeal.prepTime,
      quantity: 1
    };

    onAddToCart(cartItem);

    toast.success(
      'Added to Cart!',
      'Your AI-generated meal has been added to your cart.',
      {
        action: {
          label: 'View Cart',
          onClick: () => {
            // Cart will be visible automatically
          }
        }
      }
    );
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <ChefHat className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Meal Generator</h2>
            <p className="text-emerald-100">Create personalized meals with AI</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preferences Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
            Meal Preferences
          </h3>

          <div className="space-y-6">
            {/* Meal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPreferences(prev => ({ ...prev, mealType: type }))}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      preferences.mealType === type
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                        : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Calorie Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calorie Target: {preferences.calorieTarget} kcal
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                value={preferences.calorieTarget}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  calorieTarget: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>200</span>
                <span>1000</span>
              </div>
            </div>

            {/* Macro Targets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Macro Targets (grams)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Protein</label>
                  <input
                    type="number"
                    value={preferences.macroTargets.protein}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      macroTargets: { ...prev.macroTargets, protein: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Carbs</label>
                  <input
                    type="number"
                    value={preferences.macroTargets.carbs}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      macroTargets: { ...prev.macroTargets, carbs: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Fats</label>
                  <input
                    type="number"
                    value={preferences.macroTargets.fats}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      macroTargets: { ...prev.macroTargets, fats: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleArrayItem(
                      preferences.dietaryRestrictions,
                      option,
                      (arr) => setPreferences(prev => ({ ...prev, dietaryRestrictions: arr }))
                    )}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      preferences.dietaryRestrictions.includes(option)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateMeal}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate AI Meal</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Meal Display */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <AnimatePresence mode="wait">
            {generatedMeal ? (
              <motion.div
                key="meal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{generatedMeal.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(generatedMeal.difficulty)}`}>
                      {generatedMeal.difficulty}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {generatedMeal.prepTime}m
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{generatedMeal.description}</p>

                {/* Nutrition Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{generatedMeal.nutrition.totalCalories}</div>
                    <div className="text-xs text-gray-600">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{generatedMeal.nutrition.totalProtein}g</div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{generatedMeal.nutrition.totalCarbs}g</div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">{generatedMeal.nutrition.totalFats}g</div>
                    <div className="text-xs text-gray-600">Fats</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mb-6">
                  <button
                    onClick={addMealToCart}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={generateMeal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* Ingredients */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Ingredients</h4>
                  <div className="space-y-2">
                    {generatedMeal.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-800">{ingredient.name}</span>
                        <span className="text-sm text-gray-600">{ingredient.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Instructions</h4>
                  <ol className="space-y-2">
                    {generatedMeal.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 text-center"
              >
                <div className="py-12">
                  <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Meal Generated</h3>
                  <p className="text-gray-600">Set your preferences and click "Generate AI Meal" to create a personalized meal plan.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
