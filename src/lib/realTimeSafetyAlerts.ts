/**
 * Real-time Safety Alerts System
 * Monitors FDA data for new safety alerts and provides real-time notifications
 */

import { openFDAService, RecallEnforcement, AdverseEvent } from './openFDAService';
import { medicationSafetyMonitor, SafetyAlert } from './medicationSafetyMonitor';
import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

export interface NotificationSettings {
  enabled: boolean;
  methods: ('browser' | 'email' | 'sms')[];
  severity: ('low' | 'medium' | 'high' | 'critical')[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

export interface SafetyNotification {
  id: string;
  userId: string;
  type: 'recall' | 'adverse_event' | 'interaction' | 'safety_update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  medication: string;
  actionRequired: string;
  fdaSource: string;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  delivered: boolean;
  deliveryMethods: string[];
}

class RealTimeSafetyAlerts {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private userSubscriptions: Map<string, NotificationSettings> = new Map();
  private lastCheckTimestamp: Date = new Date();
  private notificationQueue: SafetyNotification[] = [];
  private isMonitoring: boolean = false;

  /**
   * Initialize real-time monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Load user subscriptions from database
      await this.loadUserSubscriptions();
      
      // Start monitoring
      this.startMonitoring();
      
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      console.log('Real-time safety alerts system initialized');
    } catch (error) {
      console.error('Error initializing real-time safety alerts:', error);
    }
  }

  /**
   * Subscribe user to real-time alerts
   */
  async subscribeUser(userId: string, settings: NotificationSettings): Promise<void> {
    try {
      // Save settings to database
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          enabled: settings.enabled,
          methods: settings.methods,
          severity: settings.severity,
          quiet_hours: settings.quietHours,
          frequency: settings.frequency,
          updated_at: new Date().toISOString()
        });

      // Update local cache
      this.userSubscriptions.set(userId, settings);

      console.log(`User ${userId} subscribed to real-time safety alerts`);
    } catch (error) {
      console.error('Error subscribing user to alerts:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from alerts
   */
  async unsubscribeUser(userId: string): Promise<void> {
    try {
      await supabase
        .from('notification_settings')
        .update({ enabled: false })
        .eq('user_id', userId);

      this.userSubscriptions.delete(userId);
      console.log(`User ${userId} unsubscribed from real-time safety alerts`);
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      throw error;
    }
  }

  /**
   * Start monitoring for new safety alerts
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.isMonitoring = true;
    
    // Check every 15 minutes for new FDA data
    this.monitoringInterval = setInterval(async () => {
      await this.checkForNewAlerts();
    }, 15 * 60 * 1000);

    // Initial check
    this.checkForNewAlerts();

    console.log('Real-time safety monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Real-time safety monitoring stopped');
  }

  /**
   * Check for new safety alerts
   */
  private async checkForNewAlerts(): Promise<void> {
    try {
      console.log('Checking for new FDA safety alerts...');

      // Get all users with active subscriptions
      const activeUsers = Array.from(this.userSubscriptions.entries())
        .filter(([_, settings]) => settings.enabled);

      if (activeUsers.length === 0) {
        return;
      }

      // Get user medications for all active users
      const { data: userProfiles } = await supabase
        .from('medication_profiles')
        .select('user_id, medications')
        .in('user_id', activeUsers.map(([userId]) => userId));

      if (!userProfiles || userProfiles.length === 0) {
        return;
      }

      // Check for new recalls since last check
      await this.checkForNewRecalls(userProfiles);

      // Check for significant new adverse events
      await this.checkForNewAdverseEvents(userProfiles);

      // Update last check timestamp
      this.lastCheckTimestamp = new Date();

      // Process notification queue
      await this.processNotificationQueue();

    } catch (error) {
      console.error('Error checking for new alerts:', error);
    }
  }

  /**
   * Check for new FDA recalls
   */
  private async checkForNewRecalls(userProfiles: any[]): Promise<void> {
    for (const profile of userProfiles) {
      const medications = profile.medications || [];
      
      for (const medication of medications) {
        try {
          const recalls = await openFDAService.getDrugRecalls(medication.name, 10);
          
          // Filter for recent recalls (since last check)
          const newRecalls = recalls.filter(recall => {
            const recallDate = new Date(recall.recall_initiation_date);
            return recallDate > this.lastCheckTimestamp;
          });

          // Create notifications for new recalls
          for (const recall of newRecalls) {
            await this.createSafetyNotification({
              userId: profile.user_id,
              type: 'recall',
              severity: this.getRecallSeverity(recall.classification),
              title: `FDA Recall Alert: ${medication.name}`,
              message: `${medication.name} has been recalled by the FDA. Reason: ${recall.reason_for_recall}`,
              medication: medication.name,
              actionRequired: this.getRecallAction(recall.classification),
              fdaSource: `Recall #${recall.recall_number}`,
              recall
            });
          }
        } catch (error) {
          console.error(`Error checking recalls for ${medication.name}:`, error);
        }
      }
    }
  }

  /**
   * Check for new significant adverse events
   */
  private async checkForNewAdverseEvents(userProfiles: any[]): Promise<void> {
    for (const profile of userProfiles) {
      const medications = profile.medications || [];
      
      for (const medication of medications) {
        try {
          // Get recent adverse events
          const adverseEvents = await openFDAService.searchAdverseEvents(medication.name, 20);
          
          // Filter for serious events received since last check
          const newSeriousEvents = adverseEvents.filter(event => {
            if (event.serious !== '1') return false;
            
            const receiveDate = new Date(event.receivedate);
            return receiveDate > this.lastCheckTimestamp;
          });

          // Group by reaction type and create notifications for significant patterns
          if (newSeriousEvents.length >= 3) {
            const reactionCounts = new Map<string, number>();
            newSeriousEvents.forEach(event => {
              event.reaction?.forEach(reaction => {
                if (reaction.reactionmeddrapt) {
                  const reactionName = reaction.reactionmeddrapt.toLowerCase();
                  reactionCounts.set(reactionName, (reactionCounts.get(reactionName) || 0) + 1);
                }
              });
            });

            // Alert for reactions reported 3+ times
            for (const [reaction, count] of reactionCounts.entries()) {
              if (count >= 3) {
                await this.createSafetyNotification({
                  userId: profile.user_id,
                  type: 'adverse_event',
                  severity: count > 5 ? 'high' : 'medium',
                  title: `New Adverse Event Pattern: ${medication.name}`,
                  message: `${count} new serious reports of ${reaction} associated with ${medication.name}`,
                  medication: medication.name,
                  actionRequired: 'Monitor for symptoms and consult healthcare provider if experienced',
                  fdaSource: 'FDA Adverse Event Reporting System (FAERS)'
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error checking adverse events for ${medication.name}:`, error);
        }
      }
    }
  }

  /**
   * Create a safety notification
   */
  private async createSafetyNotification(params: {
    userId: string;
    type: 'recall' | 'adverse_event' | 'interaction' | 'safety_update';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    medication: string;
    actionRequired: string;
    fdaSource: string;
    recall?: RecallEnforcement;
  }): Promise<void> {
    const notification: SafetyNotification = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId,
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      medication: params.medication,
      actionRequired: params.actionRequired,
      fdaSource: params.fdaSource,
      timestamp: new Date(),
      read: false,
      dismissed: false,
      delivered: false,
      deliveryMethods: []
    };

    // Check user notification settings
    const userSettings = this.userSubscriptions.get(params.userId);
    if (!userSettings || !userSettings.enabled) {
      return;
    }

    // Check if severity meets user threshold
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const notificationSeverityIndex = severityLevels.indexOf(params.severity);
    const userMinSeverityIndex = Math.min(...userSettings.severity.map(s => severityLevels.indexOf(s)));
    
    if (notificationSeverityIndex < userMinSeverityIndex) {
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours(userSettings.quietHours)) {
      // Queue for later delivery
      this.notificationQueue.push(notification);
      return;
    }

    // Add to queue for immediate processing
    this.notificationQueue.push(notification);

    // Save to database
    await this.saveNotificationToDatabase(notification);

    console.log(`Created safety notification for user ${params.userId}: ${params.title}`);
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    const notificationsToProcess = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const notification of notificationsToProcess) {
      try {
        const userSettings = this.userSubscriptions.get(notification.userId);
        if (!userSettings) continue;

        // Check quiet hours again
        if (this.isInQuietHours(userSettings.quietHours)) {
          // Re-queue for later
          this.notificationQueue.push(notification);
          continue;
        }

        // Deliver notification
        await this.deliverNotification(notification, userSettings);
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    }
  }

  /**
   * Deliver notification via configured methods
   */
  private async deliverNotification(notification: SafetyNotification, settings: NotificationSettings): Promise<void> {
    const deliveredMethods: string[] = [];

    // Browser notification
    if (settings.methods.includes('browser') && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.severity === 'critical',
          actions: [
            { action: 'view', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };

        deliveredMethods.push('browser');
      } catch (error) {
        console.error('Error sending browser notification:', error);
      }
    }

    // Toast notification (always show for immediate feedback)
    const toastOptions = {
      duration: notification.severity === 'critical' ? 10000 : 5000,
      position: 'top-right' as const,
      style: {
        background: notification.severity === 'critical' ? '#dc2626' : 
                   notification.severity === 'high' ? '#ea580c' :
                   notification.severity === 'medium' ? '#d97706' : '#2563eb',
        color: 'white'
      }
    };

    toast(notification.message, toastOptions);
    deliveredMethods.push('toast');

    // Update notification as delivered
    notification.delivered = true;
    notification.deliveryMethods = deliveredMethods;

    await this.updateNotificationInDatabase(notification);

    console.log(`Delivered notification ${notification.id} via: ${deliveredMethods.join(', ')}`);
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(quietHours: { enabled: boolean; start: string; end: string }): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get recall severity
   */
  private getRecallSeverity(classification: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (classification) {
      case 'Class I': return 'critical';
      case 'Class II': return 'high';
      case 'Class III': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Get recall action
   */
  private getRecallAction(classification: string): string {
    switch (classification) {
      case 'Class I': return 'STOP TAKING IMMEDIATELY - Contact healthcare provider';
      case 'Class II': return 'Contact healthcare provider about alternatives';
      case 'Class III': return 'Monitor for issues and consult healthcare provider';
      default: return 'Consult healthcare provider if concerned';
    }
  }

  /**
   * Load user subscriptions from database
   */
  private async loadUserSubscriptions(): Promise<void> {
    try {
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('enabled', true);

      if (settings) {
        settings.forEach(setting => {
          this.userSubscriptions.set(setting.user_id, {
            enabled: setting.enabled,
            methods: setting.methods,
            severity: setting.severity,
            quietHours: setting.quiet_hours,
            frequency: setting.frequency
          });
        });
      }

      console.log(`Loaded ${this.userSubscriptions.size} user subscriptions`);
    } catch (error) {
      console.error('Error loading user subscriptions:', error);
    }
  }

  /**
   * Save notification to database
   */
  private async saveNotificationToDatabase(notification: SafetyNotification): Promise<void> {
    try {
      await supabase
        .from('safety_notifications')
        .insert({
          id: notification.id,
          user_id: notification.userId,
          type: notification.type,
          severity: notification.severity,
          title: notification.title,
          message: notification.message,
          medication: notification.medication,
          action_required: notification.actionRequired,
          fda_source: notification.fdaSource,
          timestamp: notification.timestamp.toISOString(),
          read: notification.read,
          dismissed: notification.dismissed,
          delivered: notification.delivered,
          delivery_methods: notification.deliveryMethods
        });
    } catch (error) {
      console.error('Error saving notification to database:', error);
    }
  }

  /**
   * Update notification in database
   */
  private async updateNotificationInDatabase(notification: SafetyNotification): Promise<void> {
    try {
      await supabase
        .from('safety_notifications')
        .update({
          read: notification.read,
          dismissed: notification.dismissed,
          delivered: notification.delivered,
          delivery_methods: notification.deliveryMethods
        })
        .eq('id', notification.id);
    } catch (error) {
      console.error('Error updating notification in database:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<SafetyNotification[]> {
    try {
      const { data: notifications } = await supabase
        .from('safety_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      return notifications?.map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        severity: n.severity,
        title: n.title,
        message: n.message,
        medication: n.medication,
        actionRequired: n.action_required,
        fdaSource: n.fda_source,
        timestamp: new Date(n.timestamp),
        read: n.read,
        dismissed: n.dismissed,
        delivered: n.delivered,
        deliveryMethods: n.delivery_methods || []
      })) || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('safety_notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('safety_notifications')
        .update({ dismissed: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isMonitoring: boolean; lastCheck: Date; queueSize: number; subscriptions: number } {
    return {
      isMonitoring: this.isMonitoring,
      lastCheck: this.lastCheckTimestamp,
      queueSize: this.notificationQueue.length,
      subscriptions: this.userSubscriptions.size
    };
  }
}

// Export singleton instance
export const realTimeSafetyAlerts = new RealTimeSafetyAlerts();
export type { NotificationSettings, SafetyNotification };
