import { supabase } from './supabaseClient';

export interface ExerciseLog {
  id: string;
  user_id: string;
  exercise_type: string;
  duration: string; // interval in PostgreSQL
  calories_burned?: number;
  notes?: string;
  created_at: string;
}

export interface ExerciseSession {
  id: string;
  user_id: string;
  date: string;
  duration: number; // in minutes
  type: string;
  calories_burned?: number;
  notes?: string;
  created_at: string;
}

export interface ExerciseStats {
  totalSessions: number;
  totalDuration: number;
  totalCaloriesBurned: number;
  favoriteExercise: string;
  weeklyProgress: WeeklyProgress[];
}

interface WeeklyProgress {
  date: string;
  totalDuration: number;
  totalCalories: number;
}

export const exerciseService = {
  // Create a new exercise log
  async createExerciseLog(userId: string, exerciseData: Partial<ExerciseLog>): Promise<ExerciseLog> {
    const { data, error } = await supabase
      .from('exercise_logs')
      .insert([{
        user_id: userId,
        exercise_type: exerciseData.exercise_type,
        duration: exerciseData.duration,
        calories_burned: exerciseData.calories_burned,
        notes: exerciseData.notes
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new exercise session
  async createExerciseSession(userId: string, sessionData: Partial<ExerciseSession>): Promise<ExerciseSession> {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .insert([{
        user_id: userId,
        type: sessionData.type,
        duration: sessionData.duration,
        calories_burned: sessionData.calories_burned,
        notes: sessionData.notes
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's exercise logs for a specific date range
  async getExerciseLogs(userId: string, startDate: string, endDate: string): Promise<ExerciseLog[]> {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get user's exercise sessions for a specific date range
  async getExerciseSessions(userId: string, startDate: string, endDate: string): Promise<ExerciseSession[]> {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get exercise statistics for a user
  async getExerciseStats(userId: string): Promise<ExerciseStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch both logs and sessions
    const [logsResponse, sessionsResponse] = await Promise.all([
      supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('exercise_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString())
    ]);

    const logs = logsResponse.data || [];
    const sessions = sessionsResponse.data || [];

    // Calculate statistics
    const exerciseTypes = logs.map(log => log.exercise_type);
    const favoriteExercise = exerciseTypes.length > 0
      ? getMostFrequent(exerciseTypes)
      : 'No exercises yet';

    // Calculate weekly progress
    const weeklyProgress = calculateWeeklyProgress(logs, sessions);

    return {
      totalSessions: logs.length + sessions.length,
      totalDuration: calculateTotalDuration(logs, sessions),
      totalCaloriesBurned: calculateTotalCalories(logs, sessions),
      favoriteExercise,
      weeklyProgress
    };
  },

  // Update an exercise session
  async updateExerciseSession(sessionId: string, updates: Partial<ExerciseSession>): Promise<ExerciseSession> {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an exercise session
  async deleteExerciseSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('exercise_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }
};

// Helper functions
function getMostFrequent(arr: string[]): string {
  return arr.sort((a,b) =>
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop() || '';
}

function calculateTotalDuration(logs: ExerciseLog[], sessions: ExerciseSession[]): number {
  const sessionsDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const logsDuration = logs.reduce((sum, log) => {
    // Convert PostgreSQL interval to minutes
    const duration = log.duration.match(/(\d+):(\d+):(\d+)/);
    if (duration) {
      return sum + (parseInt(duration[1]) * 60 + parseInt(duration[2]));
    }
    return sum;
  }, 0);
  return sessionsDuration + logsDuration;
}

function calculateTotalCalories(logs: ExerciseLog[], sessions: ExerciseSession[]): number {
  const sessionsCalories = sessions.reduce((sum, session) => sum + (session.calories_burned || 0), 0);
  const logsCalories = logs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  return sessionsCalories + logsCalories;
}

function calculateWeeklyProgress(logs: ExerciseLog[], sessions: ExerciseSession[]): WeeklyProgress[] {
  // Implementation for weekly progress calculation
  // This would aggregate data by week and return an array of weekly statistics
  // ... (implementation details)
  return [];
}