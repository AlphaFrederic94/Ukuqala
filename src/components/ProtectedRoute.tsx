import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../lib/supabaseClient';
import { auth as firebaseAuth } from '../lib/firebaseConfig';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [checkingFirebaseAuth, setCheckingFirebaseAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        setCheckingOnboarding(true);
        // Check if the profiles table exists and has the user's record
        // First, check if the onboarding_completed column exists
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          if (error) {
            // If the profile doesn't exist, create it
            if (error.code === 'PGRST116') { // Record not found
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  onboarding_completed: false
                });

              if (insertError) throw insertError;
              setOnboardingCompleted(false);
              return;
            } else {
              throw error;
            }
          }

          setOnboardingCompleted(data?.onboarding_completed || false);
        } catch (columnError) {
          console.error('Error with onboarding_completed column:', columnError);

          // The column might not exist, let's check if the profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id
              });

            if (insertError) throw insertError;
          } else if (profileError) {
            throw profileError;
          }

          // Set onboarding as not completed since the column doesn't exist
          setOnboardingCompleted(false);
        }


      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  if (loading || (user && checkingOnboarding)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If we're already on the onboarding page, render children
  if (location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // If onboarding is not completed, redirect to onboarding
  if (onboardingCompleted === false) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}