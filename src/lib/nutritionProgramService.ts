import { supabase } from './supabaseClient';
import { safeMap } from '../utils/arrayUtils';

export interface NutritionPlan {
  id: string;
  user_id: string;
  body_type: string;
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  daily_calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  meal_plan: MealPlan[];
  active: boolean;
  created_at: string;
}

export interface MealPlan {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  calories: number;
  foods: FoodItem[];
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

class NutritionProgramService {
  async getActivePlan(userId: string): Promise<NutritionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (error) {
        // No rows found or table doesn't exist
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('No active nutrition plan found or table does not exist');
          return null;
        }
        // Not acceptable response
        if (error.code === '406' || error.status === 406) {
          console.log('Received 406 Not Acceptable response');
          return null;
        }
        console.error('Error in getActivePlan:', error);
        return null; // Return null instead of throwing to prevent app crashes
      }

      // Return the data as is, since the database schema might have changed
      return data || null;
    } catch (error) {
      console.error('Error in getActivePlan:', error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  async createPlan(userId: string, plan: Partial<NutritionPlan>): Promise<NutritionPlan> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .insert({
        user_id: userId,
        body_type: plan.body_type,
        goal: plan.goal,
        daily_calories: plan.daily_calories,
        macros: plan.macros,
        meal_plan: plan.meal_plan || [],
        active: true,
        dietary_restrictions: plan.dietary_restrictions || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlan(planId: string, updates: Partial<NutritionPlan>): Promise<NutritionPlan> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deactivatePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('nutrition_plans')
      .update({ active: false })
      .eq('id', planId);

    if (error) throw error;
  }

  // Get meal logs for a user with optional limit
  async getMealLogs(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Table doesn't exist
        if (error.code === '42P01') {
          console.log('meal_logs table does not exist');
          return [];
        }
        // Not acceptable response
        if (error.code === '406' || error.status === 406) {
          console.log('Received 406 Not Acceptable response for meal_logs');
          return [];
        }
        console.error('Error in getMealLogs:', error);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.error('Error in getMealLogs:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get water logs for a user with optional limit
  async getWaterLogs(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Table doesn't exist
        if (error.code === '42P01') {
          console.log('water_logs table does not exist');
          return [];
        }
        // Not acceptable response
        if (error.code === '406' || error.status === 406) {
          console.log('Received 406 Not Acceptable response for water_logs');
          return [];
        }
        console.error('Error in getWaterLogs:', error);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.error('Error in getWaterLogs:', error);
      return []; // Return empty array instead of throwing
    }
  }
}

export const nutritionProgramService = new NutritionProgramService();
