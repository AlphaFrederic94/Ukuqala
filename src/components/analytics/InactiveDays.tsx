import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppUsageStats } from '../../lib/appUsageService';

interface InactiveDaysProps {
  data: AppUsageStats | null;
}

const InactiveDays: React.FC<InactiveDaysProps> = ({ data }) => {
  if (!data || data.inactiveDays.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 col-span-1 md:col-span-2">
      <div className="flex items-center mb-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg mr-3">
          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Inactive Days</h3>
      </div>
      <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          You were inactive on the following days:
        </p>
        <div className="flex flex-wrap gap-2">
          {data.inactiveDays.map((day, index) => (
            <span key={index} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
              {new Date(day).toLocaleDateString()}
            </span>
          ))}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
          Regular app usage helps you stay on track with your health goals. Try to use the app daily for best results.
        </p>
      </div>
    </div>
  );
};

export default InactiveDays;
