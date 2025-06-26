import { supabase } from './supabaseClient';
import { format } from 'date-fns';

export interface HomeMetrics {
  sleep: {
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  };
  water: {
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  };
  appointments: {
    upcoming: number;
    next?: {
      doctor: string;
      date: string;
      time: string;
    };
  };
  predictions: {
    total: number;
    recent?: {
      title: string;
      result: string;
      date: string;
    };
  };
}

export const homeService = {
  // Get all metrics for the home page
  async getHomeMetrics(userId: string): Promise<HomeMetrics> {
    try {
      // Get today's date
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

      // Get next week's date
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = format(nextWeek, 'yyyy-MM-dd');

      // Fetch sleep data
      let sleepData = null;
      try {
        const { data, error } = await supabase
          .from('sleep_logs')
          .select('duration, quality')
          .eq('user_id', userId)
          .gte('created_at', `${yesterdayStr}T00:00:00`)
          .lte('created_at', `${todayStr}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error) {
          sleepData = data;
        } else {
          console.error('Error fetching sleep data:', error);
        }
      } catch (error) {
        console.error('Exception fetching sleep data:', error);
      }

      // Fetch yesterday's sleep data for trend
      let yesterdaySleepData = null;
      try {
        const { data, error } = await supabase
          .from('sleep_logs')
          .select('duration, quality')
          .eq('user_id', userId)
          .gte('created_at', `${format(new Date(yesterday.setDate(yesterday.getDate() - 1)), 'yyyy-MM-dd')}T00:00:00`)
          .lte('created_at', `${yesterdayStr}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error) {
          yesterdaySleepData = data;
        } else {
          console.error('Error fetching yesterday\'s sleep data:', error);
        }
      } catch (error) {
        console.error('Exception fetching yesterday\'s sleep data:', error);
      }

      // Fetch water data
      let waterData = null;
      try {
        const { data, error } = await supabase
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', userId)
          .gte('logged_at', `${todayStr}T00:00:00`)
          .lte('logged_at', `${todayStr}T23:59:59`);

        if (!error) {
          waterData = data;
        } else {
          console.error('Error fetching water data:', error);
        }
      } catch (error) {
        console.error('Exception fetching water data:', error);
      }

      // Fetch yesterday's water data for trend
      let yesterdayWaterData = null;
      try {
        const { data, error } = await supabase
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', userId)
          .gte('logged_at', `${yesterdayStr}T00:00:00`)
          .lte('logged_at', `${yesterdayStr}T23:59:59`);

        if (!error) {
          yesterdayWaterData = data;
        } else {
          console.error('Error fetching yesterday\'s water data:', error);
        }
      } catch (error) {
        console.error('Exception fetching yesterday\'s water data:', error);
      }

      // Fetch upcoming appointments
      let appointmentsData = null;
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            status,
            doctor_id,
            doctors:doctor_id(name, specialty)
          `)
          .eq('user_id', userId)
          .in('status', ['confirmed', 'pending'])
          .gte('appointment_date', today.toISOString())
          .lte('appointment_date', nextWeek.toISOString())
          .order('appointment_date', { ascending: true });

        if (!error) {
          appointmentsData = data;
        } else {
          console.error('Error fetching appointments:', error);
        }
      } catch (error) {
        console.error('Exception fetching appointments:', error);
      }

      console.log('Appointments data:', appointmentsData);

      // Fetch recent predictions
      let predictionsData = null;
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error) {
          predictionsData = data;
        } else {
          console.error('Error fetching predictions:', error);
        }
      } catch (error) {
        console.error('Exception fetching predictions:', error);
      }

      // Fetch total predictions count
      let predictionsCountData = null;
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('id', { count: 'exact' })
          .eq('user_id', userId);

        if (!error) {
          predictionsCountData = data;
        } else {
          console.error('Error fetching predictions count:', error);
        }
      } catch (error) {
        console.error('Exception fetching predictions count:', error);
      }

      // Calculate sleep metrics
      const sleepHours = sleepData && sleepData.length > 0
        ? parseFloat(sleepData[0].duration) || 0
        : 0;

      const yesterdaySleepHours = yesterdaySleepData && yesterdaySleepData.length > 0
        ? parseFloat(yesterdaySleepData[0].duration) || 0
        : 0;

      const sleepTrend = sleepHours > yesterdaySleepHours
        ? 'up'
        : sleepHours < yesterdaySleepHours
          ? 'down'
          : 'stable';

      // Calculate water metrics
      const waterAmount = waterData
        ? waterData.reduce((sum, log) => sum + (log.amount_ml || 0), 0) / 1000
        : 0;

      const yesterdayWaterAmount = yesterdayWaterData
        ? yesterdayWaterData.reduce((sum, log) => sum + (log.amount_ml || 0), 0) / 1000
        : 0;

      const waterTrend = waterAmount > yesterdayWaterAmount
        ? 'up'
        : waterAmount < yesterdayWaterAmount
          ? 'down'
          : 'stable';

      // Format next appointment
      const nextAppointment = appointmentsData && appointmentsData.length > 0
        ? {
            doctor: appointmentsData[0].doctors?.name || 'Unknown',
            date: format(new Date(appointmentsData[0].appointment_date), 'MMM d, yyyy'),
            time: format(new Date(appointmentsData[0].appointment_date), 'h:mm a')
          }
        : undefined;

      console.log('Next appointment:', nextAppointment);

      // Format recent prediction
      const recentPrediction = predictionsData && predictionsData.length > 0
        ? {
            title: predictionsData[0].title,
            result: predictionsData[0].result,
            date: format(new Date(predictionsData[0].created_at), 'MMM d, yyyy')
          }
        : undefined;

      return {
        sleep: {
          value: parseFloat(sleepHours.toFixed(1)),
          unit: 'hours',
          trend: sleepTrend as 'up' | 'down' | 'stable'
        },
        water: {
          value: parseFloat(waterAmount.toFixed(1)),
          unit: 'L',
          trend: waterTrend as 'up' | 'down' | 'stable'
        },
        appointments: {
          upcoming: appointmentsData?.length || 0,
          next: nextAppointment
        },
        predictions: {
          total: predictionsCountData?.length || 0,
          recent: recentPrediction
        }
      };
    } catch (error) {
      console.error('Error fetching home metrics:', error);
      return {
        sleep: { value: 0, unit: 'hours', trend: 'stable' },
        water: { value: 0, unit: 'L', trend: 'stable' },
        appointments: { upcoming: 0 },
        predictions: { total: 0 }
      };
    }
  }
};
