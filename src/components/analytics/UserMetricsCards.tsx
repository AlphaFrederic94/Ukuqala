import React from 'react';
import { User, Heart, Ruler, Weight } from 'lucide-react';

interface UserMetricsProps {
  metrics: {
    age: number;
    blood_group: string;
    height: number;
    weight: number;
  };
}

const UserMetricsCards: React.FC<UserMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-spotify-green to-spotify-green-dark dark:from-spotify-medium-gray dark:to-spotify-light-gray rounded-xl p-4 text-white dark:text-spotify-text-white shadow-lg relative overflow-hidden border border-gray-200 dark:border-spotify-lighter-gray">
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-spotify-green-hover dark:bg-spotify-lighter-gray opacity-20"></div>
        <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full bg-spotify-green-dark dark:bg-spotify-light-gray opacity-20"></div>

        <div className="flex items-center justify-between mb-2">
          <div className="bg-white/20 rounded-full p-2">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs uppercase tracking-wider text-white dark:text-spotify-text-light">Age</span>
        </div>

        <div className="mt-4">
          <div className="text-3xl font-bold">
            {metrics.age}
          </div>
          <div className="text-xs text-white dark:text-spotify-text-light">years</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-spotify-medium-gray dark:to-spotify-light-gray rounded-xl p-4 text-white dark:text-spotify-text-white shadow-lg relative overflow-hidden border border-gray-200 dark:border-spotify-lighter-gray">
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-red-400 dark:bg-spotify-lighter-gray opacity-20"></div>
        <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full bg-red-700 dark:bg-spotify-light-gray opacity-20"></div>

        <div className="flex items-center justify-between mb-2">
          <div className="bg-white/20 rounded-full p-2">
            <Heart className="w-5 h-5 text-white dark:text-spotify-text-white" />
          </div>
          <span className="text-xs uppercase tracking-wider text-red-100 dark:text-spotify-text-light">Blood Group</span>
        </div>

        <div className="mt-4">
          <div className="text-3xl font-bold">
            {metrics.blood_group}
          </div>
          <div className="text-xs text-red-100 dark:text-spotify-text-light">type</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-spotify-green to-spotify-green-dark dark:from-spotify-medium-gray dark:to-spotify-light-gray rounded-xl p-4 text-white dark:text-spotify-text-white shadow-lg relative overflow-hidden border border-gray-200 dark:border-spotify-lighter-gray">
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-spotify-green-hover dark:bg-spotify-lighter-gray opacity-20"></div>
        <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full bg-spotify-green-dark dark:bg-spotify-light-gray opacity-20"></div>

        <div className="flex items-center justify-between mb-2">
          <div className="bg-white/20 rounded-full p-2">
            <Ruler className="w-5 h-5 text-white dark:text-spotify-text-white" />
          </div>
          <span className="text-xs uppercase tracking-wider text-white dark:text-spotify-text-light">Height</span>
        </div>

        <div className="mt-4">
          <div className="text-3xl font-bold">
            {metrics.height > 0 ? metrics.height : 'N/A'}
          </div>
          <div className="text-xs text-white dark:text-spotify-text-light">{metrics.height > 0 ? 'cm' : ''}</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-spotify-medium-gray dark:to-spotify-light-gray rounded-xl p-4 text-white dark:text-spotify-text-white shadow-lg relative overflow-hidden border border-gray-200 dark:border-spotify-lighter-gray">
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-purple-400 dark:bg-spotify-lighter-gray opacity-20"></div>
        <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full bg-purple-700 dark:bg-spotify-light-gray opacity-20"></div>

        <div className="flex items-center justify-between mb-2">
          <div className="bg-white/20 rounded-full p-2">
            <Weight className="w-5 h-5 text-white dark:text-spotify-text-white" />
          </div>
          <span className="text-xs uppercase tracking-wider text-purple-100 dark:text-spotify-text-light">Weight</span>
        </div>

        <div className="mt-4">
          <div className="text-3xl font-bold">
            {metrics.weight > 0 ? metrics.weight : 'N/A'}
          </div>
          <div className="text-xs text-purple-100 dark:text-spotify-text-light">{metrics.weight > 0 ? 'kg' : ''}</div>
        </div>
      </div>
    </div>
  );
};

export default UserMetricsCards;
