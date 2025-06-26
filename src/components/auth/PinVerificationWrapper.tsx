import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface PinVerificationWrapperProps {
  children: React.ReactNode;
}

// Local storage keys
const PIN_VERIFICATION_TIME_KEY = 'careai_pin_verification_time';
const PIN_VERIFICATION_SESSION_KEY = 'careai_pin_verification_session';
const PIN_INTENDED_DESTINATION_KEY = 'careai_pin_intended_destination';
const PIN_VERIFICATION_GRACE_PERIOD = 10 * 60 * 1000; // 10 minutes

export default function PinVerificationWrapper({ children }: PinVerificationWrapperProps) {
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkPinVerification = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Store the current intended destination
        localStorage.setItem(PIN_INTENDED_DESTINATION_KEY, location.pathname + location.search);

        // Check if this is a new session or page reload
        const isNewSession = checkIfNewSession();

        // Get the last verification time from local storage
        const lastVerificationTime = localStorage.getItem(PIN_VERIFICATION_TIME_KEY);
        const graceTimeAgo = new Date(Date.now() - PIN_VERIFICATION_GRACE_PERIOD).getTime();

        // If we have a valid verification time that's within grace period
        if (lastVerificationTime && parseInt(lastVerificationTime) > graceTimeAgo) {
          console.log('PIN was verified recently, skipping verification');
          setIsPinVerified(true);
          setIsLoading(false);
          return;
        }

        // Check if user has a PIN set up in the database
        const { data, error } = await supabase
          .from('app_pins')
          .select('last_used')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle null case

        if (error) {
          console.error('Error checking PIN verification:', error);
          throw error;
        }

        if (!data) {
          // No PIN set up, redirect to PIN setup
          setIsLoading(false);
          navigate('/pin-setup');
          return;
        }

        // If we're here, we need to verify the PIN
        setIsLoading(false);
        navigate('/pin-verify', {
          state: {
            returnTo: location.pathname + location.search,
            fromReload: isNewSession
          }
        });
        return;

      } catch (err) {
        console.error('Error checking PIN verification:', err);
        // On error, redirect to PIN setup as a fallback
        navigate('/pin-setup');
      } finally {
        setIsLoading(false);
      }
    };

    // Check if this is a new session (page reload or new tab)
    const checkIfNewSession = () => {
      // Generate a random session ID if one doesn't exist
      const currentSessionId = sessionStorage.getItem(PIN_VERIFICATION_SESSION_KEY);

      if (!currentSessionId) {
        // This is a new session (page reload or new tab)
        const newSessionId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem(PIN_VERIFICATION_SESSION_KEY, newSessionId);
        console.log('[PIN] New session detected, session ID:', newSessionId);
        return true;
      }

      return false;
    };

    checkPinVerification();
  }, [user, navigate, location.pathname]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return isPinVerified ? <>{children}</> : null;
}
