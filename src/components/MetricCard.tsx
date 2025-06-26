import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon }) => (
  <div className="bg-white dark:bg-spotify-medium-gray p-4 rounded-xl shadow-sm border border-gray-200 dark:border-spotify-lighter-gray transition-all duration-200 hover:shadow-lg dark:hover:bg-spotify-light-gray metric-card">
    <div className="flex items-center mb-2">
      {icon}
      <span className="text-sm text-gray-600 dark:text-spotify-text-light ml-2 metric-label">{title}</span>
    </div>
    <span className="text-xl font-semibold dark:text-spotify-text-white metric-value">
      {value} {unit}
    </span>
  </div>
);
