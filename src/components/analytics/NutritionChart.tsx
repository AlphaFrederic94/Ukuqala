import React from 'react';
import { Line } from 'react-chartjs-2';
import { BarChart } from 'lucide-react';

interface NutritionDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionChartProps {
  data: NutritionDataPoint[];
  timeRange: string;
  onRefresh: () => void;
}

const NutritionChart: React.FC<NutritionChartProps> = ({ data, timeRange, onRefresh }) => {
  // Format dates for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = {
    labels: data.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Calories',
        data: data.map(d => d.calories),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        yAxisID: 'y',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Protein (g)',
        data: data.map(d => d.protein),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Carbs (g)',
        data: data.map(d => d.carbs),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Fat (g)',
        data: data.map(d => d.fat),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Calories'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Grams'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Nutrition Overview (${timeRange === '7days' ? 'Last 7 Days' : timeRange === '30days' ? 'Last 30 Days' : 'Last 90 Days'})`
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mr-3">
          <BarChart className="h-5 w-5 text-orange-500 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nutrition Trends</h3>
      </div>
      <div className="h-64">
        {data.length > 0 ? (
          <Line 
            data={chartData} 
            options={chartOptions} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 mb-4 inline-block">
                <BarChart className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                No Nutrition Data Available
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                Start logging your meals to see nutrition trends and insights.
                Visit the Nutrition section to add your first meal.
              </p>
              <div className="space-y-2">
                <button
                  onClick={onRefresh}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
                >
                  Refresh Data
                </button>
                <button
                  onClick={() => window.location.href = '/nutrition'}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Meals
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Calories', value: Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length), color: 'text-red-600' },
            { label: 'Avg Protein', value: Math.round(data.reduce((sum, d) => sum + d.protein, 0) / data.length), color: 'text-blue-600' },
            { label: 'Avg Carbs', value: Math.round(data.reduce((sum, d) => sum + d.carbs, 0) / data.length), color: 'text-teal-600' },
            { label: 'Avg Fat', value: Math.round(data.reduce((sum, d) => sum + d.fat, 0) / data.length), color: 'text-orange-600' }
          ].map((stat, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}{stat.label.includes('Calories') ? '' : 'g'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NutritionChart;
