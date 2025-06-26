import React from 'react';
import { Line } from 'react-chartjs-2';
import { Smartphone } from 'lucide-react';
import { AppUsageStats } from '../../lib/appUsageService';

interface AppUsageChartProps {
  data: AppUsageStats | null;
  onRefresh: () => void;
}

const AppUsageChart: React.FC<AppUsageChartProps> = ({ data, onRefresh }) => {
  if (!data || data.sessionsPerDay.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
            <Smartphone className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">App Usage</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No app usage data available</p>
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

  const chartData = {
    labels: data.sessionsPerDay.map(d => d.date),
    datasets: [
      {
        label: 'Sessions',
        data: data.sessionsPerDay.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'App Usage Sessions'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Sessions'
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
          <Smartphone className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">App Usage</h3>
      </div>
      <div className="h-64">
        <Line
          data={chartData}
          options={chartOptions}
        />
      </div>
    </div>
  );
};

export default AppUsageChart;
