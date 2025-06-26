import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { initializeDatabase, createTablesDirectly } from '../utils/simpleDatabaseChecker';

/**
 * Component that initializes the database on mount
 * Shows a loading state while initializing
 */
const DatabaseInitializer = ({ children }) => {
  const [status, setStatus] = useState('initializing'); // 'initializing', 'success', 'error'
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to initialize the database
        const result = await initializeDatabase();

        if (result.success) {
          setStatus('success');
        } else {
          console.error('Failed to initialize database:', result.error);
          setError(result.error);
          setStatus('error');
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        setError(error);
        setStatus('error');
      }
    };

    initialize();
  }, [isRetrying]);

  const handleRetry = async () => {
    setStatus('initializing');
    setError(null);
    setIsRetrying(prev => !prev);
  };

  const handleDirectCreation = async () => {
    setStatus('initializing');
    setError(null);

    try {
      // Try to create tables directly using SQL
      const result = await createTablesDirectly();

      if (result.success) {
        setStatus('success');
      } else {
        console.error('Failed to create tables directly:', result.error);
        setError(result.error);
        setStatus('error');
      }
    } catch (error) {
      console.error('Error creating tables directly:', error);
      setError(error);
      setStatus('error');
    }
  };

  // Skip showing the initializing screen and just render children
  if (status === 'initializing') {
    return children;
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Database Initialization Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error setting up the database. This might be due to connection issues or missing permissions.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-left mb-4 overflow-auto max-h-40">
            <pre className="text-xs text-red-600 dark:text-red-400">
              {error ? JSON.stringify(error, null, 2) : 'Unknown error'}
            </pre>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleDirectCreation}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Direct Creation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If success, render children
  return children;
};

export default DatabaseInitializer;
