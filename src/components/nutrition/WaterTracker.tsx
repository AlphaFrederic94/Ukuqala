import React, { useState, useEffect } from 'react';
import { nutritionService } from '@/lib/nutritionService';
import { WaterLog, WaterReminder } from '@/types/nutrition';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabaseClient';
import { notificationService } from '@/services/notificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Plus, Minus, Bell, Award, RefreshCw, Clock, CheckCircle, X } from 'lucide-react';

export const WaterTracker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayWater, setTodayWater] = useState<WaterLog[]>([]);
  const [reminder, setReminder] = useState<WaterReminder | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderHours, setReminderHours] = useState<number[]>([9, 12, 15, 18]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('water_tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'water_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          loadTodayWater();
        }
      )
      .subscribe();

    // Initialize
    loadTodayWater();
    loadReminder();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Set up reminders when they change
  useEffect(() => {
    if (user && reminder?.is_active) {
      // Set up browser notifications for hydration reminders
      notificationService.setupHydrationReminders(user.id, reminder.reminder_intervals);
      setReminderHours(reminder.reminder_intervals);
    }

    return () => {
      // Clean up reminders when component unmounts
      notificationService.clearHydrationReminders();
    };
  }, [user, reminder]);

  const loadTodayWater = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await nutritionService.getDailyWaterLogs(user.id, today);
      setTodayWater(logs);
    } catch (error) {
      console.error('Error loading water logs:', error);
      toast({
        title: "Error",
        description: "Failed to load water logs",
        variant: "destructive"
      });
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!user) return;
    try {
      setLoading(true);
      await nutritionService.logWater(user.id, amount);
      await loadTodayWater();
      toast({
        title: "Success",
        description: "Water logged successfully"
      });
    } catch (error) {
      console.error('Error logging water:', error);
      toast({
        title: "Error",
        description: "Failed to log water",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetReminder = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to set reminders",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Request notification permission using our service
      const permissionGranted = await notificationService.requestPermission();
      if (!permissionGranted) {
        toast({
          title: "Error",
          description: "Please enable notifications to set reminders",
          variant: "destructive"
        });
        return;
      }

      // If we're showing the modal, use the selected hours
      // Otherwise use the default or existing hours
      const intervals = showReminderModal ? reminderHours :
                       (reminder?.reminder_intervals || Array.from({ length: 10 }, (_, i) => i + 8));

      const reminderData: Omit<WaterReminder, 'id'> = {
        user_id: user.id,
        target_daily_ml: 2000,
        reminder_intervals: intervals,
        is_active: true
      };

      // Save to database
      const newReminder = await nutritionService.setWaterReminder(user.id, reminderData);

      if (newReminder) {
        setReminder(newReminder);

        // Set up notifications using our service
        await notificationService.setupHydrationReminders(user.id, newReminder.reminder_intervals);

        // Show a test notification
        notificationService.showNotification({
          title: 'Hydration Reminders Active',
          body: `You'll receive reminders at the following hours: ${newReminder.reminder_intervals.join(', ')}`,
          sound: 'hydration',
          onClick: () => window.focus()
        });

        toast({
          title: "Success",
          description: "Water reminders set successfully"
        });
        setShowReminderModal(false);
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load water reminder settings
  const loadReminder = async () => {
    if (!user) return;
    try {
      const reminder = await nutritionService.getWaterReminder(user.id);
      setReminder(reminder);
      if (reminder?.reminder_intervals) {
        setReminderHours(reminder.reminder_intervals);
      }
    } catch (error) {
      console.error('Error loading reminder:', error);
    }
  };

  const totalWater = todayWater.reduce((sum, log) => sum + log.amount_ml, 0);
  const dailyGoal = 2000; // ml
  const progressPercentage = Math.min(Math.round((totalWater / dailyGoal) * 100), 100);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
        {/* Water progress visualization */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Droplet className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold dark:text-white">Daily Hydration</h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {progressPercentage >= 100 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" /> Goal achieved!
                </span>
              ) : (
                <span>{progressPercentage}% of daily goal</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalWater}ml</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">of {dailyGoal}ml goal</div>
          </div>
        </div>

        {/* Water level visualization */}
        <div className="relative h-32 bg-white dark:bg-gray-800 rounded-lg overflow-hidden mb-6 border border-blue-100 dark:border-gray-700">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
            style={{ height: `${progressPercentage}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/20"></div>
          </div>

          {/* Water level markers */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 px-3">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">2000ml</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">100%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">1000ml</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">50%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">0ml</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">0%</span>
            </div>
          </div>

          {/* Current level indicator */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-white flex items-center justify-end px-2"
            style={{ bottom: `${progressPercentage}%`, display: progressPercentage > 0 ? 'flex' : 'none' }}
          >
            <span className="text-xs font-medium text-white bg-blue-600 px-1.5 py-0.5 rounded">
              {totalWater}ml
            </span>
          </div>
        </div>

        {/* Quick add buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[250, 500, 1000].map(amount => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddWater(amount)}
              disabled={loading}
              className="py-2 px-3 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {amount}ml
            </motion.button>
          ))}
        </div>

        {/* Reminder section */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-6 border border-gray-100 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium dark:text-white">Hydration Reminders</h3>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReminderModal(true)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${reminder?.is_active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50'} disabled:opacity-50`}
            >
              {reminder?.is_active ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Reminders Active
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-1" />
                  Set Reminders
                </>
              )}
            </motion.button>
          </div>

          {reminder && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <p>Reminders set for: {reminder.reminder_intervals.map(hour => `${hour}:00`).join(', ')}</p>
            </div>
          )}
        </div>

        {/* Today's log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium dark:text-white">Today's Log</h3>
            </div>

            <span className="text-sm text-gray-600 dark:text-gray-400">{todayWater.length} entries</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            <AnimatePresence>
              {todayWater.length > 0 ? (
                todayWater.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center">
                      <Droplet className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">{new Date(log.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{log.amount_ml}ml</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p>No water logged today</p>
                  <p className="text-sm mt-1">Add your first glass!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowReminderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold dark:text-white">Set Hydration Reminders</h3>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select hours when you want to receive hydration reminders. We recommend drinking water regularly throughout the day.
              </p>

              <div className="mb-6">
                <h4 className="font-medium mb-3 dark:text-white">Reminder Hours</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                    <button
                      key={hour}
                      onClick={() => {
                        if (reminderHours.includes(hour)) {
                          setReminderHours(reminderHours.filter(h => h !== hour));
                        } else {
                          setReminderHours([...reminderHours, hour].sort((a, b) => a - b));
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium ${reminderHours.includes(hour)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                      {hour}:00
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetReminder}
                  disabled={loading || reminderHours.length === 0}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Setting...
                    </>
                  ) : (
                    'Save Reminders'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
