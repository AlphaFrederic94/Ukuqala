import { supabase } from './supabaseClient';

export const userService = {
  isNewUser: async (userId: string) => {
    const { data: profileData } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId);

    return !profileData?.length;
  },

  initializeNewUser: async (userId: string) => {
    const today = new Date().toISOString();

    // Initialize profiles with onboarding_completed set to false
    await supabase.from('profiles').upsert([
      {
        id: userId,
        onboarding_completed: false,
        created_at: today,
        updated_at: today
      }
    ]);

    // Initialize medical_records with default values
    await supabase.from('medical_records').insert([
      {
        user_id: userId,
        blood_group: 'Not Set',
        height: 0,
        current_weight: 0,
        target_weight: 0,
        date_of_birth: null,
        gender: 'Not Set',
        activity_level: 'Not Set',
        allergies: [],
        medications: [],
        health_conditions: [],
        created_at: today,
        updated_at: today
      }
    ]);

    // Initialize weight_measurements with a placeholder
    await supabase.from('weight_measurements').insert([
      {
        user_id: userId,
        weight: 0,
        date: today,
        notes: 'Initial measurement'
      }
    ]);
  }
};
