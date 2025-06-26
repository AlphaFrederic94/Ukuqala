import { supabase } from '../lib/supabaseClient';

// Sound effects for notifications
const NOTIFICATION_SOUNDS = {
  hydration: new Audio('/sounds/water-drop.mp3'),
  meal: new Audio('/sounds/meal-reminder.mp3'),
  general: new Audio('/sounds/notification.mp3')
};

type NotificationOptions = {
  title: string;
  body: string;
  icon?: string;
  sound?: 'hydration' | 'meal' | 'general';
  onClick?: () => void;
};

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private activeReminders: Map<string, number> = new Map();

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    this.permission = Notification.permission;
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification({ title, body, icon = '/favicon.ico', sound, onClick }: NotificationOptions) {
    if (!('Notification' in window)) return;

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        requireInteraction: true,
      });

      // Play sound if specified
      if (sound && NOTIFICATION_SOUNDS[sound]) {
        NOTIFICATION_SOUNDS[sound].play().catch(err => {
          console.warn('Could not play notification sound:', err);
        });
      }

      if (onClick) {
        notification.onclick = () => {
          onClick();
          notification.close();
        };
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Set up hourly hydration reminders
  async setupHydrationReminders(userId: string, intervals: number[] = []): Promise<boolean> {
    // Clear any existing reminders
    this.clearHydrationReminders();

    // Default to hourly reminders if no intervals provided
    const reminderIntervals = intervals.length > 0 ? intervals : Array.from({ length: 10 }, (_, i) => i + 8); // 8am to 6pm

    try {
      // Save reminder settings to database
      const { data, error } = await supabase
        .from('water_reminders')
        .upsert({
          user_id: userId,
          reminder_intervals: reminderIntervals,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Set up the reminders in the browser
      this.scheduleHydrationReminders(reminderIntervals);

      return true;
    } catch (error) {
      console.error('Error setting up hydration reminders:', error);
      return false;
    }
  }

  // Schedule hydration reminders based on provided hours
  scheduleHydrationReminders(hours: number[]) {
    // Clear any existing reminders
    this.clearHydrationReminders();

    const now = new Date();
    const currentHour = now.getHours();

    hours.forEach(hour => {
      // Calculate time until this hour
      let reminderTime = new Date();
      reminderTime.setHours(hour, 0, 0, 0);

      // If this hour has already passed today, schedule for tomorrow
      if (hour <= currentHour) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      // Set timeout for this reminder
      const timerId = window.setTimeout(() => {
        this.showNotification({
          title: 'Hydration Reminder',
          body: 'Time to drink some water! Stay hydrated for better health.',
          sound: 'hydration',
          onClick: () => {
            window.focus();
            window.location.href = '/nutrition/hydration';
          }
        });

        // Schedule the next reminder for tomorrow at the same time
        const nextDay = new Date(reminderTime);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextTimeUntil = nextDay.getTime() - new Date().getTime();

        const nextTimerId = window.setTimeout(() => {
          this.scheduleHydrationReminders([hour]);
        }, nextTimeUntil);

        this.activeReminders.set(`hydration-${hour}`, nextTimerId);
      }, timeUntilReminder);

      this.activeReminders.set(`hydration-${hour}`, timerId);
    });
  }

  // Clear all active hydration reminders
  clearHydrationReminders() {
    for (const [key, timerId] of this.activeReminders.entries()) {
      if (key.startsWith('hydration-')) {
        window.clearTimeout(timerId);
        this.activeReminders.delete(key);
      }
    }
  }

  // Get active hydration reminder settings for a user
  async getHydrationReminders(userId: string): Promise<number[] | null> {
    try {
      const { data, error } = await supabase
        .from('water_reminders')
        .select('reminder_intervals, is_active')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return data && data.is_active ? data.reminder_intervals : null;
    } catch (error) {
      console.error('Error getting hydration reminders:', error);
      return null;
    }
  }

  // Disable hydration reminders
  async disableHydrationReminders(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('water_reminders')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      this.clearHydrationReminders();
      return true;
    } catch (error) {
      console.error('Error disabling hydration reminders:', error);
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();