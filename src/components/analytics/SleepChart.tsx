import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Moon } from 'lucide-react';

interface SleepDataPoint {
  date: string;
  quality: number;
  duration: number;
}

interface SleepChartProps {
  data: SleepDataPoint[];
  onRefresh: () => void;
}

const SleepChart: React.FC<SleepChartProps> = ({ data, onRefresh }) => {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Sleep Quality',
        data: data.map(d => d.quality),
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
        borderRadius: 5,
        maxBarThickness: 25
      },
      {
        label: 'Sleep Duration (hours)',
        data: data.map(d => d.duration),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        borderRadius: 5,
        maxBarThickness: 25
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
        text: 'Sleep Quality & Duration'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value (Quality / Hours)'
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
          <Moon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Sleep Quality</h3>
      </div>
      <div className="h-64">
        {data.length > 0 ? (
          <Bar
            data={chartData}
            options={chartOptions}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No sleep data available</p>
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

export default SleepChart;
