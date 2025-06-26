import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { exerciseService, ExerciseStats, ExerciseSession } from '@/lib/exerciseService';
import { Activity, Heart, Flame, Clock } from 'lucide-react';
import { calculateCaloriesBurned } from '@/utils/fitnessCalculations';
import { supabase } from '@/lib/supabaseClient';

interface ExerciseTrackerProps {
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
  currentExercise: number;
  onExerciseComplete: () => void;
}

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  bodyType,
  currentExercise,
  onExerciseComplete
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [heartRate, setHeartRate] = useState(70);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (user?.id) {
      loadExerciseStats();
    }
  }, [user?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        setExerciseTime(time => time + 1);
        
        // Simulate heart rate changes based on intensity
        setHeartRate(prev => {
          const baseChange = intensity === 'high' ? 8 : intensity === 'medium' ? 5 : 3;
          const change = Math.floor(Math.random() * baseChange) - Math.floor(baseChange / 2);
          return Math.min(180, Math.max(60, prev + change));
        });
        
        // Calculate calories burned based on heart rate, body type, and duration
        setCaloriesBurned(prev => {
          const caloriesPerMinute = calculateCaloriesBurned({
            heartRate,
            bodyType,
            intensity,
            weight: user?.weight || 70 // default weight if not available
          });
          return prev + (caloriesPerMinute / 60); // Convert to per second
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, intensity, bodyType, heartRate, user?.weight]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('exercise_tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          loadExerciseStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadExerciseStats = async () => {
    if (!user?.id) return;
    
    try {
      const statsData = await exerciseService.getExerciseStats(user.id);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading exercise stats:', err);
    }
  };

  const handleStartExercise = () => {
    setIsActive(true);
  };

  const handleCompleteExercise = async () => {
    if (!user?.id) return;

    try {
      setIsActive(false);
      
      await exerciseService.createExerciseSession(user.id, {
        type: bodyType,
        duration: exerciseTime,
        calories_burned: caloriesBurned,
        heart_rate_avg: heartRate,
        date: new Date().toISOString()
      });

      // Reset local stats
      setExerciseTime(0);
      onExerciseComplete();
      
      // Reload stats
      await loadExerciseStats();
    } catch (err) {
      console.error('Error saving exercise session:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium dark:text-gray-200">Time</span>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            {Math.floor(exerciseTime / 60)}:{(exerciseTime % 60).toString().padStart(2, '0')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium dark:text-gray-200">Heart Rate</span>
          </div>
          <p className="text-2xl font-bold dark:text-white">{heartRate} BPM</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium dark:text-gray-200">Calories</span>
          </div>
          <p className="text-2xl font-bold dark:text-white">{Math.floor(caloriesBurned)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium dark:text-gray-200">Progress</span>
          </div>
          <p className="text-2xl font-bold dark:text-white">{currentExercise + 1}/3</p>
        </div>
      </div>

      {/* Exercise Controls */}
      <div className="flex justify-center gap-4">
        {!isActive ? (
          <button
            onClick={handleStartExercise}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Exercise
          </button>
        ) : (
          <button
            onClick={handleCompleteExercise}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Complete Exercise
          </button>
        )}
      </div>

      {/* Overall Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Overall Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-xl font-bold dark:text-white">{stats.totalSessions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Minutes</p>
              <p className="text-xl font-bold dark:text-white">
                {Math.floor(stats.totalDuration / 60)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseTracker;
