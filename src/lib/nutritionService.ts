import { supabase } from './supabaseClient';
import { FoodItem, MealLog, WaterLog, NutritionLog, WaterReminder, MealReminder } from '@/types/nutrition';
import { PREDEFINED_MEALS } from '@/constants/predefinedMeals';

const calculateTotals = (foods: FoodItem[]) => {
  return foods.reduce((acc, food) => ({
    calories: acc.calories + (food.calories || 0),
    protein: acc.protein + (food.protein || 0),
    carbs: acc.carbs + (food.carbs || 0),
    fat: acc.fat + (food.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

export const nutritionService = {
  // Daily logs
  async getDailyLogs(userId: string, date: string): Promise<NutritionLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', `${date}T00:00:00`)
      .lte('logged_at', `${date}T23:59:59`);

    if (error) throw error;
    return data || [];
  },

  // Get recent meal logs with limit
  async getMealLogs(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get meal logs for a specific day
  async getDailyMealLogs(userId: string, date: string): Promise<MealLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', `${date}T00:00:00`)
      .lte('logged_at', `${date}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get recent meal logs with specific limit
  async getRecentMealLogs(userId: string, limit: number = 10): Promise<MealLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Water tracking
  async getDailyWaterLogs(userId: string, date: string): Promise<WaterLog[]> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', `${date}T00:00:00`)
      .lte('logged_at', `${date}T23:59:59`);

    if (error) throw error;
    return data || [];
  },

  // Get recent water logs with limit
  async getWaterLogs(userId: string, limit: number = 10): Promise<WaterLog[]> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async logWater(userId: string, waterData: { amount_ml: number; drink_type?: string; logged_at?: string }): Promise<WaterLog> {
    const { data, error } = await supabase
      .from('water_logs')
      .insert([{
        user_id: userId,
        amount_ml: waterData.amount_ml,
        drink_type: waterData.drink_type || 'water',
        logged_at: waterData.logged_at || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setWaterReminder(userId: string, reminderData: Omit<WaterReminder, 'id'>): Promise<WaterReminder> {
    const { data, error } = await supabase
      .from('water_reminders')
      .upsert([{
        user_id: userId,
        ...reminderData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Custom foods
  async getUserCustomFoods(userId: string): Promise<FoodItem[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_custom', true);

    if (error) throw error;
    return data || [];
  },

  async addFoodToMeal(userId: string, mealType: string, food: FoodItem): Promise<MealLog> {
    // First check if there's an existing log for this meal type today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingLogs, error: fetchError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_type', mealType)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);

    if (fetchError) throw fetchError;

    if (existingLogs && existingLogs.length > 0) {
      // Update existing log
      const existingLog = existingLogs[0];
      const updatedFoodItems = [...existingLog.food_items, food];
      const totals = calculateTotals(updatedFoodItems);

      const { data, error } = await supabase
        .from('meal_logs')
        .update({
          food_items: updatedFoodItems,
          calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat
        })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('meal_logs')
        .insert([{
          user_id: userId,
          meal_type: mealType,
          food_items: [food],
          calories: food.calories,
          total_protein: food.protein,
          total_carbs: food.carbs,
          total_fat: food.fat,
          logged_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Create a new meal log with multiple food items
  async createMealLog(userId: string, mealData: {
    meal_type: string;
    food_items: FoodItem[];
    calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }): Promise<MealLog> {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert([{
        user_id: userId,
        meal_type: mealData.meal_type,
        food_items: mealData.food_items,
        calories: mealData.calories,
        total_protein: mealData.total_protein,
        total_carbs: mealData.total_carbs,
        total_fat: mealData.total_fat,
        logged_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeFoodFromMeal(logId: string, foodIndex: number): Promise<void> {
    const { data: currentLog } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (!currentLog) throw new Error('Log not found');

    const updatedFoodItems = currentLog.food_items.filter((_, idx) => idx !== foodIndex);
    const updatedTotals = updatedFoodItems.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      total_protein: acc.total_protein + food.protein,
      total_carbs: acc.total_carbs + food.carbs,
      total_fat: acc.total_fat + food.fat
    }), { calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });

    const { error } = await supabase
      .from('meal_logs')
      .update({
        food_items: updatedFoodItems,
        ...updatedTotals
      })
      .eq('id', logId);

    if (error) throw error;
  },

  async searchFoods(query: string): Promise<FoodItem[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async getMealHistory(userId: string, startDate: string, endDate: string): Promise<NutritionLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', `${startDate}T00:00:00`)
      .lte('logged_at', `${endDate}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Meal reminders
  async setMealReminder(userId: string, reminderData: Omit<MealReminder, 'id'>): Promise<MealReminder> {
    const { data, error } = await supabase
      .from('meal_reminders')
      .upsert([{
        user_id: userId,
        ...reminderData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMealReminders(userId: string): Promise<MealReminder[]> {
    const { data, error } = await supabase
      .from('meal_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // Water reminders
  async getWaterReminder(userId: string): Promise<WaterReminder | null> {
    const { data, error } = await supabase
      .from('water_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  },

  async getWeeklyWaterLogs(userId: string): Promise<any[]> {
    // Get logs for the past 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 7 days including today

    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: false });

    if (error) throw error;

    // Group by day
    const dailyLogs: Record<string, any> = {};

    // Initialize all 7 days with 0 ml
    for (let i = 0; i < 7; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyLogs[dateStr] = { date: dateStr, total_ml: 0 };
    }

    // Fill in actual data
    (data || []).forEach(log => {
      const dateStr = new Date(log.logged_at).toISOString().split('T')[0];
      if (dailyLogs[dateStr]) {
        dailyLogs[dateStr].total_ml += log.amount_ml;
      }
    });

    // Convert to array and sort by date
    return Object.values(dailyLogs).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
};
