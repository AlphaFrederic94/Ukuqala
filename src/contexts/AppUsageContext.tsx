import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { startSession, endSession, updateCurrentPage } from '../lib/appUsageService';

interface AppUsageContextType {
  sessionId: string | null;
}

const AppUsageContext = createContext<AppUsageContextType>({
  sessionId: null
});

export const useAppUsage = () => useContext(AppUsageContext);

export const AppUsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start a new session when the user logs in
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      if (user) {
        const id = await startSession(user.id);
        if (mounted) {
          setSessionId(id);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      // End the session when the component unmounts (user logs out)
      if (sessionId) {
        endSession(sessionId);
      }
    };
  }, [user]);

  // Update current page when location changes
  useEffect(() => {
    if (sessionId && location.pathname) {
      updateCurrentPage(sessionId, location.pathname);
    }
  }, [sessionId, location.pathname]);

  // Handle window unload to end session
  useEffect(() => {
    const handleUnload = () => {
      if (sessionId) {
        // Use synchronous method for unload event
        navigator.sendBeacon(
          `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_usage_logs?id=eq.${sessionId}`,
          JSON.stringify({
            session_end: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [sessionId]);

  return (
    <AppUsageContext.Provider value={{ sessionId }}>
      {children}
    </AppUsageContext.Provider>
  );
};
