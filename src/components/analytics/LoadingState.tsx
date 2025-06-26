import React from 'react';
import { Activity } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Loading Your Health Data</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          We're gathering your latest health metrics and analytics. This will just take a moment...
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
