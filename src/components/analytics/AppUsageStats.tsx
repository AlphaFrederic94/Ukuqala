import React from 'react';
import { Clock, Zap, Timer } from 'lucide-react';
import { AppUsageStats as AppUsageStatsType } from '../../lib/appUsageService';

interface AppUsageStatsProps {
  data: AppUsageStatsType | null;
  onRefresh: () => void;
}

const AppUsageStats: React.FC<AppUsageStatsProps> = ({ data, onRefresh }) => {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
            <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">App Usage Stats</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No app usage stats available</p>
          <button 
            onClick={onRefresh} 
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-3">
          <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">App Usage Stats</h3>
      </div>
      <div className="h-64 flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 rounded-full p-2">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs uppercase tracking-wider text-blue-100">Total Sessions</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{data.totalSessions}</div>
              <div className="text-xs text-blue-100">sessions</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 rounded-full p-2">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs uppercase tracking-wider text-purple-100">Time Spent</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{data.totalTimeSpent}</div>
              <div className="text-xs text-purple-100">minutes</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Most Visited Pages</h4>
          <div className="space-y-2">
            {data.mostVisitedPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{page.page}</span>
                <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {page.count} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppUsageStats;
