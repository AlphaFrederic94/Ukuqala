import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Plus,
  Minus,
  Target,
  Clock,
  Award,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertTriangle,
  Coffee,
  Wine,
  Milk
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { nutritionService } from '@/lib/nutritionService';

interface WaterTrackingWidgetProps {
  currentIntake: number;
  goal: number;
  onUpdate: () => void;
}

interface WaterLog {
  id: string;
  amount_ml: number;
  logged_at: string;
  drink_type?: string;
}

const DRINK_TYPES = [
  { id: 'water', name: 'Water', icon: Droplets, color: 'bg-blue-500', multiplier: 1 },
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-amber-600', multiplier: 0.8 },
  { id: 'tea', name: 'Tea', icon: Coffee, color: 'bg-green-600', multiplier: 0.9 },
  { id: 'juice', name: 'Juice', icon: Wine, color: 'bg-orange-500', multiplier: 0.7 },
  { id: 'milk', name: 'Milk', icon: Milk, color: 'bg-gray-100', multiplier: 0.9 },
];

const QUICK_AMOUNTS = [250, 500, 750, 1000]; // ml

export const WaterTrackingWidget: React.FC<WaterTrackingWidgetProps> = ({
  currentIntake,
  goal,
  onUpdate
}) => {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [selectedDrinkType, setSelectedDrinkType] = useState('water');
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      loadTodayWaterLogs();
      calculateStreak();
    }
  }, [user]);

  const loadTodayWaterLogs = async () => {
    if (!user) return;

    try {
      const logs = await nutritionService.getWaterLogs(user.id, 20);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log =>
        log.logged_at?.startsWith(today)
      );
      setTodayLogs(todayLogs);
    } catch (error) {
      console.error('Error loading water logs:', error);
    }
  };

  const calculateStreak = async () => {
    if (!user) return;

    try {
      // This would need to be implemented in the nutrition service
      // For now, we'll use a placeholder
      setStreak(5);
    } catch (error) {
      console.error('Error calculating streak:', error);
    }
  };

  const addWaterIntake = async (amount: number, drinkType: string = 'water') => {
    if (!user || amount <= 0) return;

    try {
      setLoading(true);

      await nutritionService.logWater(user.id, {
        amount_ml: amount,
        drink_type: drinkType,
        logged_at: new Date().toISOString()
      });

      await loadTodayWaterLogs();
      onUpdate();

      // Reset custom input
      setCustomAmount('');
      setShowCustomInput(false);

    } catch (error) {
      console.error('Error adding water intake:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeLastEntry = async () => {
    if (!user || todayLogs.length === 0) return;

    try {
      setLoading(true);

      const lastLog = todayLogs[todayLogs.length - 1];
      // Note: deleteWaterLog method needs to be implemented in nutritionService
      // For now, we'll just reload the logs

      await loadTodayWaterLogs();
      onUpdate();

    } catch (error) {
      console.error('Error removing water entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.min((currentIntake / goal) * 100, 100);
  const isGoalReached = currentIntake >= goal;
  const remaining = Math.max(goal - currentIntake, 0);

  const getHydrationStatus = () => {
    const percentage = (currentIntake / goal) * 100;
    if (percentage >= 100) return { status: 'Excellent', color: 'text-green-500', icon: CheckCircle };
    if (percentage >= 75) return { status: 'Good', color: 'text-blue-500', icon: TrendingUp };
    if (percentage >= 50) return { status: 'Fair', color: 'text-yellow-500', icon: Clock };
    return { status: 'Low', color: 'text-red-500', icon: AlertTriangle };
  };

  const hydrationStatus = getHydrationStatus();
  const StatusIcon = hydrationStatus.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hydration Tracker</h2>
        <p className="text-gray-500 dark:text-gray-400">Stay hydrated, stay healthy</p>
      </div>

      {/* Main Progress Circle */}
      <div className="flex justify-center">
        <div className="relative">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <motion.path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              className="text-blue-500"
              stroke="currentColor"
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${progress}, 100` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={currentIntake}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {currentIntake}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                / {goal} ml
              </div>
              <div className={`flex items-center space-x-1 ${hydrationStatus.color}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{hydrationStatus.status}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700"
        >
          <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{remaining}ml</div>
          <div className="text-xs text-gray-500">Remaining</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700"
        >
          <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{streak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700"
        >
          <Droplets className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">{todayLogs.length}</div>
          <div className="text-xs text-gray-500">Drinks Today</div>
        </motion.div>
      </div>

      {/* Drink Type Selector */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Drink Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {DRINK_TYPES.map((drink) => {
            const DrinkIcon = drink.icon;
            return (
              <button
                key={drink.id}
                onClick={() => setSelectedDrinkType(drink.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedDrinkType === drink.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-8 h-8 ${drink.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <DrinkIcon className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{drink.name}</div>
                <div className="text-xs text-gray-500">×{drink.multiplier}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Add</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {QUICK_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addWaterIntake(amount, selectedDrinkType)}
              disabled={loading}
              className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mx-auto mb-1" />
              {amount}ml
            </motion.button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="flex space-x-3">
          <AnimatePresence>
            {showCustomInput ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 flex space-x-2"
              >
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount (ml)"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const amount = parseInt(customAmount);
                    if (amount > 0) {
                      addWaterIntake(amount, selectedDrinkType);
                    }
                  }}
                  disabled={!customAmount || parseInt(customAmount) <= 0 || loading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowCustomInput(true)}
                className="flex-1 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <Plus className="h-4 w-4 mx-auto mb-1" />
                Custom Amount
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Today's Log */}
      {todayLogs.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Intake</h3>
            <button
              onClick={removeLastEntry}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
              <span className="text-sm">Remove Last</span>
            </button>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {todayLogs.slice().reverse().map((log, index) => {
              const drinkType = DRINK_TYPES.find(d => d.id === log.drink_type) || DRINK_TYPES[0];
              const DrinkIcon = drinkType.icon;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 ${drinkType.color} rounded-full flex items-center justify-center`}>
                      <DrinkIcon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.amount_ml}ml
                    </span>
                    <span className="text-xs text-gray-500">
                      {drinkType.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.logged_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Achievement */}
      <AnimatePresence>
        {isGoalReached && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center"
          >
            <Award className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Goal Achieved! 🎉</h3>
            <p className="text-green-100">
              Congratulations! You've reached your daily hydration goal.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaterTrackingWidget;
