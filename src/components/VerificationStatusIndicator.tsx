import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { getVerificationStatus } from '../services/studentVerificationService';
import { useAuth } from '../contexts/AuthContext';

interface VerificationStatusIndicatorProps {
  onVerified?: () => void;
  showRefresh?: boolean;
}

const VerificationStatusIndicator: React.FC<VerificationStatusIndicatorProps> = ({
  onVerified,
  showRefresh = true
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [timeRemaining, setTimeRemaining] = useState<number>(120); // 2 minutes in seconds
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to check verification status
  const checkVerificationStatus = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      setError(null); // Clear any previous errors

      const { status: verificationStatus } = await getVerificationStatus(user.id);
      setStatus(verificationStatus as any);
      setLastChecked(new Date());

      if (verificationStatus === 'verified' && onVerified) {
        onVerified();
      }
    } catch (error: any) {
      console.error('Error checking verification status:', error);

      // Set a user-friendly error message
      if (error.message && (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('connection'))) {
        setError('Network connection error while checking student verification. Please check your internet connection and try again.');
      } else {
        setError('Error checking student verification status. Please try refreshing.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check status on mount and when user changes
  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    }
  }, [user]);

  // Set up countdown timer for pending status
  useEffect(() => {
    if (status !== 'pending') return;

    // Start countdown from 2 minutes
    setTimeRemaining(120);

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-check status when timer reaches zero
          checkVerificationStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Also set up periodic status checks every 15 seconds (more frequent)
    const statusCheckTimer = setInterval(() => {
      checkVerificationStatus();
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(statusCheckTimer);
    };
  }, [status]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the progress bar (based on 2 minutes)
  const progressPercentage = Math.max(0, Math.min(100, ((120 - timeRemaining) / 120) * 100));

  if (status === 'none') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 mb-6 shadow-md ${
        status === 'verified'
          ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
          : status === 'pending'
          ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}
    >
      <div className="flex items-center">
        {status === 'verified' ? (
          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
        ) : status === 'pending' ? (
          <Clock className="w-6 h-6 text-blue-500 mr-3" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
        )}

        <div className="flex-1">
          <h3 className={`font-semibold ${
            status === 'verified'
              ? 'text-green-700 dark:text-green-400'
              : status === 'pending'
              ? 'text-blue-700 dark:text-blue-400'
              : 'text-red-700 dark:text-red-400'
          }`}>
            {status === 'verified'
              ? 'Verification Successful'
              : status === 'pending'
              ? 'Verification in Progress'
              : 'Verification Rejected'}
          </h3>

          <p className={`text-sm ${
            status === 'verified'
              ? 'text-green-600 dark:text-green-300'
              : status === 'pending'
              ? 'text-blue-600 dark:text-blue-300'
              : 'text-red-600 dark:text-red-300'
          }`}>
            {status === 'verified'
              ? 'Your student status has been verified. You now have full access.'
              : status === 'pending'
              ? `Your verification is being processed. Estimated time remaining: ${formatTimeRemaining()}`
              : 'Your verification was rejected. Please try again with valid documents.'}
          </p>

          {lastChecked && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {showRefresh && (
          <button
            onClick={checkVerificationStatus}
            disabled={isRefreshing}
            className={`p-2 rounded-full ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Refresh verification status"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {status === 'pending' && (
        <div className="mt-3 bg-blue-100 dark:bg-blue-800/30 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 dark:bg-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start"
        >
          {error.includes('Network') ? (
            <WifiOff className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={checkVerificationStatus}
              className="text-xs text-red-600 dark:text-red-400 mt-1 underline hover:text-red-800 dark:hover:text-red-200"
            >
              Try again
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VerificationStatusIndicator;
