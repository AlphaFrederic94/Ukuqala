import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { nutritionProgramService } from '@/lib/nutritionProgramService';
import { PieChart, Activity, Apple, Utensils, ArrowLeft, ArrowRight, Calculator, Info, CheckCircle } from 'lucide-react';

const CreateNutritionPlan: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    body_type: '',
    goal: '',
    daily_calories: '',
    activity_level: 'moderate',
    weight: '',
    height: '',
    age: '',
    gender: '',
    dietary_restrictions: [] as string[],
    macros: {
      protein: '',
      carbs: '',
      fat: '' // We'll convert this to 'fats' when submitting
    }
  });

  const [step, setStep] = useState(1);
  const [calculatedCalories, setCalculatedCalories] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);

  // Calculate calories based on user data
  const calculateCalories = () => {
    const { weight, height, age, gender, activity_level } = formData;

    if (!weight || !height || !age || !gender) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Convert string inputs to numbers
    const weightKg = parseFloat(weight);
    const heightCm = parseFloat(height);
    const ageYears = parseInt(age);

    // Base metabolic rate (BMR) using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      active: 1.725,       // Hard exercise 6-7 days/week
      very_active: 1.9     // Very hard exercise & physical job
    };

    const multiplier = activityMultipliers[activity_level as keyof typeof activityMultipliers];
    const tdee = Math.round(bmr * multiplier); // Total Daily Energy Expenditure

    // Adjust based on goal
    let goalCalories = tdee;
    if (formData.goal === 'weight_loss') {
      goalCalories = Math.round(tdee * 0.8); // 20% deficit
    } else if (formData.goal === 'muscle_gain') {
      goalCalories = Math.round(tdee * 1.1); // 10% surplus
    }

    setCalculatedCalories(goalCalories);

    // Update form data with calculated calories
    setFormData({
      ...formData,
      daily_calories: goalCalories.toString(),
      macros: {
        // Default macro split based on goal
        protein: Math.round(goalCalories * (formData.goal === 'muscle_gain' ? 0.3 : 0.25) / 4).toString(), // 4 calories per gram
        carbs: Math.round(goalCalories * (formData.goal === 'weight_loss' ? 0.4 : 0.5) / 4).toString(),   // 4 calories per gram
        fat: Math.round(goalCalories * (formData.goal === 'weight_loss' ? 0.35 : 0.25) / 9).toString()    // 9 calories per gram
      }
    });

    setShowCalculator(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await nutritionProgramService.createPlan(user.id, {
        ...formData,
        daily_calories: parseInt(formData.daily_calories || '0'),
        weight: parseFloat(formData.weight || '0'),
        height: parseFloat(formData.height || '0'),
        age: parseInt(formData.age || '0'),
        macros: {
          protein: parseInt(formData.macros.protein || '0'),
          carbs: parseInt(formData.macros.carbs || '0'),
          fats: parseInt(formData.macros.fat || '0')
        }
      });

      toast({
        title: "Success",
        description: "Nutrition plan created successfully",
      });
      navigate('/nutrition');
    } catch (error) {
      console.error('Error creating nutrition plan:', error);
      toast({
        title: "Error",
        description: "Failed to create nutrition plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle dietary restriction toggle
  const toggleRestriction = (restriction: string) => {
    if (formData.dietary_restrictions.includes(restriction)) {
      setFormData({
        ...formData,
        dietary_restrictions: formData.dietary_restrictions.filter(r => r !== restriction)
      });
    } else {
      setFormData({
        ...formData,
        dietary_restrictions: [...formData.dietary_restrictions, restriction]
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl overflow-hidden mb-8">
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
            <button
              onClick={() => navigate('/nutrition')}
              className="flex items-center text-green-200 hover:text-white mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Nutrition Dashboard
            </button>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-white mb-2 flex items-center"
            >
              <PieChart className="h-8 w-8 mr-3" />
              Create Your Nutrition Plan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-green-100 mb-6"
            >
              Personalize your nutrition goals based on your body type and fitness objectives
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        <div>
          <label className="block text-sm font-medium mb-2">Body Type</label>
          <select
            value={formData.body_type}
            onChange={(e) => setFormData({...formData, body_type: e.target.value})}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Body Type</option>
            <option value="ectomorph">Ectomorph</option>
            <option value="mesomorph">Mesomorph</option>
            <option value="endomorph">Endomorph</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Goal</label>
          <select
            value={formData.goal}
            onChange={(e) => setFormData({...formData, goal: e.target.value})}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Goal</option>
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Daily Calories</label>
          <input
            type="number"
            value={formData.daily_calories}
            onChange={(e) => setFormData({...formData, daily_calories: e.target.value})}
            className="w-full p-2 border rounded-lg"
            required
            min="1200"
            max="5000"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Macronutrients (grams)</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Protein</label>
            <input
              type="number"
              value={formData.macros.protein}
              onChange={(e) => setFormData({
                ...formData,
                macros: {...formData.macros, protein: e.target.value}
              })}
              className="w-full p-2 border rounded-lg"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Carbs</label>
            <input
              type="number"
              value={formData.macros.carbs}
              onChange={(e) => setFormData({
                ...formData,
                macros: {...formData.macros, carbs: e.target.value}
              })}
              className="w-full p-2 border rounded-lg"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fat</label>
            <input
              type="number"
              value={formData.macros.fat}
              onChange={(e) => setFormData({
                ...formData,
                macros: {...formData.macros, fat: e.target.value}
              })}
              className="w-full p-2 border rounded-lg"
              required
              min="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Plan'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default CreateNutritionPlan;