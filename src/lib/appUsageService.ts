import { supabase } from './supabaseClient';

// Interface for app usage data
export interface AppUsageSession {
  id?: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  duration?: number;
  pages_visited?: string[];
  device_info?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

// Interface for app usage statistics
export interface AppUsageStats {
  totalSessions: number;
  totalTimeSpent: number; // in minutes
  averageSessionDuration: number; // in minutes
  mostVisitedPages: { page: string; count: number }[];
  sessionsPerDay: { date: string; count: number }[];
  inactiveDays: string[];
}

// Start a new session
export const startSession = async (userId: string): Promise<string | null> => {
  try {
    // Get browser and device info
    const deviceInfo = {
      browser: getBrowser(),
      os: getOS(),
      device: getDevice()
    };

    const { data, error } = await supabase
      .from('app_usage_logs')
      .insert({
        user_id: userId,
        session_start: new Date().toISOString(),
        device_info: deviceInfo,
        pages_visited: [window.location.pathname]
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in startSession:', error);
    return null;
  }
};

// End a session
export const endSession = async (sessionId: string): Promise<boolean> => {
  try {
    const now = new Date();
    const { data: session, error: fetchError } = await supabase
      .from('app_usage_logs')
      .select('session_start, pages_visited')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      return false;
    }

    // Calculate duration in seconds
    const startTime = new Date(session.session_start);
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const { error } = await supabase
      .from('app_usage_logs')
      .update({
        session_end: now.toISOString(),
        duration,
        updated_at: now.toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in endSession:', error);
    return false;
  }
};

// Update current page
export const updateCurrentPage = async (sessionId: string, page: string): Promise<boolean> => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('app_usage_logs')
      .select('pages_visited')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      return false;
    }

    let pagesVisited = session.pages_visited || [];
    if (!Array.isArray(pagesVisited)) {
      pagesVisited = [];
    }

    // Add current page if not already in the list
    if (!pagesVisited.includes(page)) {
      pagesVisited.push(page);
    }

    const { error } = await supabase
      .from('app_usage_logs')
      .update({
        pages_visited: pagesVisited,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating current page:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCurrentPage:', error);
    return false;
  }
};

// Get app usage statistics for a user
export const getAppUsageStats = async (userId: string, days: number = 30): Promise<AppUsageStats | null> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('app_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('session_start', startDate.toISOString())
      .order('session_start', { ascending: false });

    if (error) {
      console.error('Error fetching app usage data:', error);
      return null;
    }

    if (!data || data.length === 0) {
      // Return default stats if no data
      return {
        totalSessions: 0,
        totalTimeSpent: 0,
        averageSessionDuration: 0,
        mostVisitedPages: [],
        sessionsPerDay: [],
        inactiveDays: []
      };
    }

    // Calculate total sessions
    const totalSessions = data.length;

    // Calculate total time spent (in minutes)
    const totalTimeSpent = data.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0) / 60;

    // Calculate average session duration (in minutes)
    const averageSessionDuration = totalTimeSpent / totalSessions;

    // Calculate most visited pages
    const pageVisits: Record<string, number> = {};
    data.forEach(session => {
      const pages = session.pages_visited || [];
      pages.forEach(page => {
        pageVisits[page] = (pageVisits[page] || 0) + 1;
      });
    });

    const mostVisitedPages = Object.entries(pageVisits)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate sessions per day
    const sessionsPerDay: Record<string, number> = {};
    const dateSet = new Set<string>();

    // Initialize all dates in the range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      sessionsPerDay[dateStr] = 0;
      dateSet.add(dateStr);
    }

    // Count sessions per day
    data.forEach(session => {
      const dateStr = new Date(session.session_start).toISOString().split('T')[0];
      sessionsPerDay[dateStr] = (sessionsPerDay[dateStr] || 0) + 1;
      dateSet.delete(dateStr); // Remove from inactive days
    });

    // Format sessions per day for chart
    const formattedSessionsPerDay = Object.entries(sessionsPerDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get inactive days
    const inactiveDays = Array.from(dateSet);

    return {
      totalSessions,
      totalTimeSpent: Math.round(totalTimeSpent),
      averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
      mostVisitedPages,
      sessionsPerDay: formattedSessionsPerDay,
      inactiveDays
    };
  } catch (error) {
    console.error('Error in getAppUsageStats:', error);
    return null;
  }
};

// Helper functions to get browser and device info
const getBrowser = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  if (userAgent.indexOf("Opera") > -1) return "Opera";
  
  return "Unknown";
};

const getOS = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Win") > -1) return "Windows";
  if (userAgent.indexOf("Mac") > -1) return "MacOS";
  if (userAgent.indexOf("Linux") > -1) return "Linux";
  if (userAgent.indexOf("Android") > -1) return "Android";
  if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) return "iOS";
  
  return "Unknown";
};

const getDevice = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("iPhone") > -1) return "iPhone";
  if (userAgent.indexOf("iPad") > -1) return "iPad";
  if (userAgent.indexOf("Android") > -1 && userAgent.indexOf("Mobile") > -1) return "Android Phone";
  if (userAgent.indexOf("Android") > -1) return "Android Tablet";
  
  return "Desktop";
};
