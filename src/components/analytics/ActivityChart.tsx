import React from 'react';
import { Line } from 'react-chartjs-2';
import { Activity } from 'lucide-react';

interface ActivityDataPoint {
  date: string;
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  onRefresh: () => void;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Steps',
        data: data.map(d => d.steps),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Active Minutes',
        data: data.map(d => d.activeMinutes),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activity Trends'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Steps'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Minutes'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 col-span-1 md:col-span-2">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
          <Activity className="h-5 w-5 text-green-500 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Activity Trends</h3>
      </div>
      <div className="h-64">
        {data.length > 0 ? (
          <Line
            data={chartData}
            options={chartOptions}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No activity data available</p>
            <button 
              onClick={onRefresh} 
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityChart;
