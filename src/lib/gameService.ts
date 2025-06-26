import { supabase } from './supabaseClient';

export interface GameResult {
  user_id: string;
  game_type: 'tic-tac-toe' | 'chess';
  result: 'win' | 'loss' | 'draw';
  score: number;
  opponent: 'computer' | 'player';
  moves?: number;
  duration_seconds?: number;
}

export interface GameSettings {
  user_id: string;
  game_type: 'tic-tac-toe' | 'chess';
  difficulty: 'easy' | 'medium' | 'hard';
  sound_enabled: boolean;
  animations_enabled: boolean;
}

export const gameService = {
  // Save game result
  async saveGameResult(result: GameResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_results')
        .insert([result]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  },
  
  // Get user's game history
  async getGameHistory(userId: string, gameType?: 'tic-tac-toe' | 'chess'): Promise<GameResult[]> {
    try {
      let query = supabase
        .from('game_results')
        .select('*')
        .eq('user_id', userId);
        
      if (gameType) {
        query = query.eq('game_type', gameType);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game history:', error);
      return [];
    }
  },
  
  // Get or create game settings
  async getGameSettings(userId: string, gameType: 'tic-tac-toe' | 'chess'): Promise<GameSettings> {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('game_type', gameType)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const defaultSettings: GameSettings = {
            user_id: userId,
            game_type: gameType,
            difficulty: 'medium',
            sound_enabled: true,
            animations_enabled: true
          };
          
          const { data: newSettings, error: insertError } = await supabase
            .from('game_settings')
            .insert([defaultSettings])
            .select()
            .single();
            
          if (insertError) throw insertError;
          return newSettings;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching game settings:', error);
      // Return default settings if there's an error
      return {
        user_id: userId,
        game_type: gameType,
        difficulty: 'medium',
        sound_enabled: true,
        animations_enabled: true
      };
    }
  },
  
  // Update game settings
  async updateGameSettings(userId: string, gameType: 'tic-tac-toe' | 'chess', updates: Partial<GameSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_settings')
        .update(updates)
        .eq('user_id', userId)
        .eq('game_type', gameType);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating game settings:', error);
      throw error;
    }
  }
};
