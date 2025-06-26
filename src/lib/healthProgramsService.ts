import { supabase } from './supabaseClient';
import { format } from 'date-fns';

export interface HealthProgram {
  id: string;
  userId: string;
  type: 'exercise' | 'nutrition' | 'sleep' | 'mental';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  metrics: Record<string, number>;
}

export interface ProgramProgress {
  date: string;
  metrics: Record<string, number>;
  notes?: string;
}

export const healthProgramsService = {
  async createProgram(userId: string, type: HealthProgram['type'], initialMetrics: Record<string, number>) {
    const { data, error } = await supabase
      .from('health_programs')
      .insert({
        user_id: userId,
        type,
        start_date: new Date().toISOString(),
        end_date: null,
        status: 'active',
        progress: 0,
        metrics: initialMetrics
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProgress(programId: string, progress: ProgramProgress) {
    const { data, error } = await supabase
      .from('program_progress')
      .insert({
        program_id: programId,
        date: progress.date,
        metrics: progress.metrics,
        notes: progress.notes
      });

    if (error) throw error;
    return data;
  },

  async getUserPrograms(userId: string) {
    const { data, error } = await supabase
      .from('health_programs')
      .select(`
        *,
        program_progress (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProgramMetrics(programId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('program_progress')
      .select('*')
      .eq('program_id', programId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }
};