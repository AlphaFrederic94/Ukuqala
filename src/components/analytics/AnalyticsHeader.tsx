import React from 'react';
import { Activity, Calendar, RefreshCw, Moon, Sun } from 'lucide-react';

interface AnalyticsHeaderProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
  refreshData: () => void;
  refreshing: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  timeRange,
  setTimeRange,
  refreshData,
  refreshing,
  darkMode,
  toggleDarkMode
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8">
      <div className="flex items-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4 shadow-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Health Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track your health metrics and progress
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 border border-gray-100 dark:border-gray-700">
          <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg px-4 py-2 transition-colors duration-200 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
