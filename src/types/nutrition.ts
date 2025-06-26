export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_custom: boolean;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: string;
  food_items: FoodItem[];
  calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  logged_at: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface WaterReminder {
  id: string;
  user_id: string;
  target_daily_ml: number;
  reminder_intervals: number[];  // Hours of the day [9, 12, 15, 18]
  is_active: boolean;
}

export interface NutritionTip {
  id: string;
  category: 'general' | 'meal-specific' | 'diet-type';
  title: string;
  description: string;
  meal_type?: string;  // breakfast, lunch, dinner, snack
  diet_type?: string;  // vegan, keto, paleo, etc.
  recommended_times?: string[];  // Best times to follow this tip
}

export interface MealSuggestion {
  id: string;
  meal_type: string;
  name: string;
  description: string;
  nutrition_facts: FoodItem;
  preparation_time: number;  // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: string[];
  diet_categories: string[];  // ['vegetarian', 'low-carb', etc.]
}

export interface NutritionGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

export type MealReminderFrequency = 'daily' | 'weekdays' | 'custom';

export interface MealReminder {
  id: string;
  user_id: string;
  meal_type: string;
  time: string;  // HH:mm format
  frequency: MealReminderFrequency;
  custom_days?: number[];  // [0,1,2,3,4,5,6] where 0 is Sunday
  is_active: boolean;
  notification_type: 'push' | 'email' | 'both';
}
