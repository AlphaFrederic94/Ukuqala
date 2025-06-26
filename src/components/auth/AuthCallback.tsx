import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        if (data.session) {
          console.log('Authentication successful:', data.session.user);
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Check if user needs onboarding
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', data.session.user.id)
            .single();

          // Redirect based on onboarding status
          setTimeout(() => {
            if (profile?.onboarding_completed) {
              navigate('/home', { replace: true });
            } else {
              navigate('/onboarding', { replace: true });
            }
          }, 1500);
        } else {
          // No session found, redirect to login
          setStatus('error');
          setMessage('No authentication session found.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            {status === 'loading' && (
              <LoadingSpinner />
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Welcome to CareAI!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>
          
          {status === 'loading' && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we complete your sign-in...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
