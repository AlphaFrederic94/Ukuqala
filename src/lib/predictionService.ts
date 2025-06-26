import { supabase } from './supabaseClient';

export interface Prediction {
  id: string;
  user_id: string;
  prediction_type: 'heart_disease' | 'diabetes' | 'brain_cancer' | 'skin_cancer' | 'symptoms';
  title: string;
  result: string;
  result_details?: any;
  risk_level: 'low' | 'moderate' | 'high' | 'unknown';
  created_at: string;
}

export interface PredictionStats {
  total_count: number;
  low_risk_count: number;
  moderate_risk_count: number;
  high_risk_count: number;
}

export const predictionService = {
  // Save a new prediction
  async savePrediction(prediction: Omit<Prediction, 'id' | 'created_at'>): Promise<Prediction> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .insert([prediction])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving prediction:', error);
      throw error;
    }
  },

  // Get recent predictions for a user
  async getRecentPredictions(userId: string, limit: number = 5): Promise<Prediction[]> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent predictions:', error);
      throw error;
    }
  },

  // Get prediction statistics
  async getPredictionStats(userId: string): Promise<PredictionStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_prediction_stats', { user_id: userId });

      if (error) throw error;
      
      return data || {
        total_count: 0,
        low_risk_count: 0,
        moderate_risk_count: 0,
        high_risk_count: 0
      };
    } catch (error) {
      console.error('Error getting prediction stats:', error);
      return {
        total_count: 0,
        low_risk_count: 0,
        moderate_risk_count: 0,
        high_risk_count: 0
      };
    }
  },

  // Get predictions by type
  async getPredictionsByType(userId: string, type: string): Promise<Prediction[]> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('prediction_type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error getting ${type} predictions:`, error);
      throw error;
    }
  },

  // Get a specific prediction by ID
  async getPredictionById(predictionId: string): Promise<Prediction | null> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', predictionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Record not found
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting prediction by ID:', error);
      throw error;
    }
  }
};
