import { supabase } from './supabaseClient';

export interface SleepProgram {
  id: string;
  user_id: string;
  wake_time: string;
  sleep_time: string;
  duration: string;
  created_at?: string;
  active?: boolean;
  alarm_enabled?: boolean;
}

export interface SleepLog {
  id: string;
  user_id: string;
  sleep_time: string;
  wake_time: string;
  quality?: number;
  notes?: string;
  created_at?: string;
}

// Utility function to extract the date part from a timestamp
const getDatePart = (timestamp: string): string => {
  if (!timestamp) return '';
  return timestamp.split('T')[0];
};

export const sleepProgramService = {
  async getActiveProgram(userId: string) {
    try {
      console.log('Getting active program for user:', userId);

      const { data, error } = await supabase
        .from('sleep_programs')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No active sleep program found for user:', userId);
          return null; // No rows returned
        }
        console.error('Error getting active program:', error);
        throw error;
      }

      console.log('Active sleep program found:', data);
      return data;
    } catch (error) {
      console.error('Error in getActiveProgram:', error);
      // Return null instead of throwing to prevent cascading errors
      return null;
    }
  },

  async createProgram(userId: string, program: {
    sleepTime: string;
    wakeTime: string;
    duration: number;
    alarmEnabled?: boolean;
  }) {
    try {
      console.log('Creating sleep program with:', {
        userId,
        program
      });

      // First deactivate any existing active programs
      await this.deactivatePrograms(userId);
      console.log('Deactivated existing programs');

      // Format the time values correctly for PostgreSQL time without time zone
      // Make sure they are in HH:MM:SS format
      const formatTimeForDB = (timeStr) => {
        if (!timeStr) return null;

        // If the time is already in HH:MM:SS format, return it
        if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr;

        // If the time is in HH:MM format, add seconds
        if (timeStr.match(/^\d{2}:\d{2}$/)) return `${timeStr}:00`;

        // Default fallback
        return timeStr;
      };

      // Prepare the program data with formatted times
      const programData = {
        user_id: userId,
        wake_time: formatTimeForDB(program.wakeTime),
        sleep_time: formatTimeForDB(program.sleepTime),
        duration: `${program.duration} hours`,
        active: true,
        alarm_enabled: program.alarmEnabled !== undefined ? program.alarmEnabled : true
      };

      // Validate the data before sending to the database
      if (!programData.sleep_time) {
        console.error('Invalid sleep_time:', program.sleepTime);
        throw new Error('Invalid sleep_time format');
      }

      if (!programData.wake_time) {
        console.error('Invalid wake_time:', program.wakeTime);
        throw new Error('Invalid wake_time format');
      }

      console.log('Formatted sleep program data:', programData);

      // Then create the new program
      const { data, error } = await supabase
        .from('sleep_programs')
        .insert(programData)
        .select()
        .single();

      if (error) {
        console.error('Error creating sleep program:', error);
        throw error;
      }

      console.log('Sleep program created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createProgram:', error);
      throw error;
    }
  },

  async deactivatePrograms(userId: string) {
    try {
      console.log('Deactivating existing programs for user:', userId);
      const { error } = await supabase
        .from('sleep_programs')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        console.error('Error deactivating programs:', error);
        throw error;
      }
      console.log('Programs deactivated successfully');
    } catch (error) {
      console.error('Error in deactivatePrograms:', error);
      throw error;
    }
  },

  async logSleep(userId: string, log: {
    quality: number;
    notes?: string;
  }) {
    try {
      console.log('Starting logSleep for user:', userId, 'with log:', log);

      // Get the active program to get sleep and wake times
      const activeProgram = await this.getActiveProgram(userId);
      console.log('Active program for sleep log:', activeProgram);

      // Use the active program's sleep and wake times, or use the default ones
      const sleepTime = activeProgram?.sleep_time || '22:00';
      const wakeTime = activeProgram?.wake_time || '06:00';

      // Format the time values correctly for PostgreSQL time without time zone
      // Make sure they are in HH:MM:SS format
      const formatTimeForDB = (timeStr) => {
        if (!timeStr) return null;

        // If the time is already in HH:MM:SS format, return it
        if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr;

        // If the time is in HH:MM format, add seconds
        if (timeStr.match(/^\d{2}:\d{2}$/)) return `${timeStr}:00`;

        // Default fallback
        return timeStr;
      };

      // Validate quality value - must be an integer between 1 and 10
      let qualityValue = log.quality;

      // Ensure quality is a valid integer between 1 and 10
      if (typeof qualityValue !== 'number' || isNaN(qualityValue)) {
        qualityValue = 5; // Default to 5 if not a valid number
      } else {
        // Round to nearest integer and clamp between 1 and 10
        qualityValue = Math.max(1, Math.min(10, Math.round(qualityValue)));
      }

      console.log('Validated quality value:', qualityValue);

      // Create a properly formatted log data object
      // Only include fields that are in the sleep_logs table schema
      const logData: any = {
        user_id: userId,
        sleep_time: formatTimeForDB(sleepTime),
        wake_time: formatTimeForDB(wakeTime),
        quality: qualityValue
      };

      // Only add notes if it's not empty
      if (log.notes) {
        logData.notes = log.notes;
      }

      // Validate the data before sending to the database
      if (!logData.sleep_time) {
        console.error('Invalid sleep_time:', sleepTime);
        throw new Error('Invalid sleep_time format');
      }

      if (!logData.wake_time) {
        console.error('Invalid wake_time:', wakeTime);
        throw new Error('Invalid wake_time format');
      }

      // Log the formatted data
      console.log('Formatted sleep log data:', logData);

      console.log('Saving sleep log with:', logData);

      // Log the exact request we're sending to Supabase
      console.log('Sending request to Supabase:', {
        table: 'sleep_logs',
        method: 'insert',
        data: logData
      });

      // Try a different approach using a direct SQL query
      try {
        // First try the regular insert
        const { data, error } = await supabase
          .from('sleep_logs')
          .insert(logData)
          .select()
          .single();

        if (error) {
          console.error('Regular insert failed, trying SQL query approach');

          // Try a simpler approach with just the required fields
          const simpleData = {
            user_id: userId,
            sleep_time: logData.sleep_time,
            wake_time: logData.wake_time,
            quality: logData.quality
          };

          console.log('Trying simpler insert with only required fields:', simpleData);

          const { data: simpleSavedData, error: simpleError } = await supabase
            .from('sleep_logs')
            .insert(simpleData)
            .select()
            .single();

          if (simpleError) {
            console.error('Simple insert approach also failed:', simpleError);
            throw simpleError;
          }

          return simpleSavedData;
        }

        return data;
      } catch (insertError) {
        console.error('All insert approaches failed:', insertError);
        throw insertError;
      }

      // Error handling is now done in the try/catch block above

      // This line is no longer needed as we return from the try/catch block
    } catch (error) {
      console.error('Error in logSleep:', error);
      throw error;
    }
  },

  async getSleepLogs(userId: string, limit = 7) {
    try {
      console.log('Getting sleep logs for user:', userId, 'with limit:', limit);

      // Get the current date
      const today = new Date();

      // Format date as YYYY-MM-DD
      const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };

      // Get date for 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = formatDate(thirtyDaysAgo);
      const endDate = formatDate(today);

      console.log(`Fetching sleep logs from ${startDate} to ${endDate}`);

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting sleep logs:', error);
        throw error;
      }

      console.log('Sleep logs retrieved successfully:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getSleepLogs:', error);
      return []; // Return empty array instead of throwing to prevent cascading errors
    }
  },

  async getSleepStats(userId: string, startDate: string, endDate: string) {
    try {
      console.log('Getting sleep stats for user:', userId, 'from', startDate, 'to', endDate);
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting sleep stats:', error);
        throw error;
      }

      console.log('Sleep stats retrieved successfully:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getSleepStats:', error);
      return []; // Return empty array instead of throwing to prevent cascading errors
    }
  }
};