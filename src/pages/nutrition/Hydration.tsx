import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, Calendar, ChevronLeft, Info, Award, TrendingUp } from 'lucide-react';
import { WaterTracker } from '@/components/nutrition/WaterTracker';
import { useAuth } from '@/contexts/AuthContext';
import { nutritionService } from '@/lib/nutritionService';

const Hydration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [waterStats, setWaterStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWaterStats();
    }
  }, [user]);

  const loadWaterStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get water logs for today
      const todayLogs = await nutritionService.getDailyWaterLogs(user.id, today);
      
      // Get water logs for the past week
      const pastWeekLogs = await nutritionService.getWeeklyWaterLogs(user.id);
      
      // Calculate stats
      const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount_ml, 0);
      const dailyAverage = pastWeekLogs.length > 0 
        ? Math.round(pastWeekLogs.reduce((sum, day) => sum + day.total_ml, 0) / pastWeekLogs.length) 
        : 0;
      
      setWaterStats({
        todayLogs,
        pastWeekLogs,
        todayTotal,
        dailyAverage,
        streak: calculateStreak(pastWeekLogs),
      });
    } catch (error) {
      console.error('Error loading water stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate streak of consecutive days with water logged
  const calculateStreak = (weeklyLogs: any[]) => {
    if (!weeklyLogs || weeklyLogs.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const dayLog = weeklyLogs.find(log => log.date === checkDateStr);
      
      if (dayLog && dayLog.total_ml > 0) {
        streak++;
      } else if (streak > 0) {
        // Break the streak once we find a day with no water
        break;
      }
    }
    
    return streak;
  };

  const hydrationTips = [
    "Drink a glass of water first thing in the morning to kickstart your metabolism",
    "Keep a reusable water bottle with you throughout the day",
    "Set reminders to drink water every hour",
    "Add natural flavors like lemon, cucumber, or berries to make water more appealing",
    "Drink a glass of water before each meal to help with digestion and portion control"
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl overflow-hidden mb-8">
        <div className="px-8 py-10 md:py-12 relative">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="hydration-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#hydration-grid)"/>
            </svg>
          </div>
          
          <div className="relative z-10 max-w-3xl">
            <button 
              onClick={() => navigate('/nutrition')}
              className="flex items-center text-blue-200 hover:text-white mb-4"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Nutrition Dashboard
            </button>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-white mb-2 flex items-center"
            >
              <Droplet className="h-8 w-8 mr-3" />
              Hydration Tracking
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-blue-100 mb-6"
            >
              Monitor your daily water intake and stay properly hydrated
            </motion.p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Main water tracker */}
          <WaterTracker />
          
          {/* Hydration stats */}
          {!loading && waterStats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-8 border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
                Your Hydration Stats
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 flex flex-col items-center">
                  <Droplet className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Today's Total</div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{waterStats.todayTotal} ml</div>
                </div>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-5 flex flex-col items-center">
                  <Calendar className="h-8 w-8 text-indigo-500 mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Daily Average</div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{waterStats.dailyAverage} ml</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 flex flex-col items-center">
                  <Award className="h-8 w-8 text-purple-500 mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{waterStats.streak} days</div>
                </div>
              </div>
              
              {/* Weekly chart */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4 dark:text-white">Weekly Progress</h3>
                <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex h-full items-end justify-between">
                    {waterStats.pastWeekLogs.map((day: any, index: number) => {
                      const percentage = Math.min(Math.round((day.total_ml / 2000) * 100), 100);
                      const date = new Date(day.date);
                      const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
                      
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="w-full max-w-[30px] bg-blue-500 rounded-t-sm transition-all duration-500"
                            style={{ height: `${percentage}%` }}
                          ></div>
                          <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">{dayName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Hydration tips sidebar */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800 sticky top-4"
          >
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold dark:text-white">Hydration Tips</h3>
            </div>
            
            <div className="space-y-4">
              {hydrationTips.map((tip, index) => (
                <div key={index} className="flex items-start">
                  <Droplet className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 className="font-medium mb-2 dark:text-white">Did you know?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Proper hydration can improve energy levels, brain function, and physical performance. It also helps regulate body temperature and prevent various health issues.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hydration;
