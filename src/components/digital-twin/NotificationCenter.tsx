import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  Settings,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Clock,
  Smartphone,
  Mail,
  MessageSquare,
  Volume2,
  VolumeX,
  Filter,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { realTimeSafetyAlerts, NotificationSettings, SafetyNotification } from '../../lib/realTimeSafetyAlerts';
import { toast } from 'react-hot-toast';

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SafetyNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    methods: ['browser'],
    severity: ['medium', 'high', 'critical'],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: 'immediate'
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadSettings();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const userNotifications = await realTimeSafetyAlerts.getUserNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    // In a real implementation, you would load settings from the database
    // For now, we'll use default settings
    setSettings({
      enabled: true,
      methods: ['browser'],
      severity: ['medium', 'high', 'critical'],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      frequency: 'immediate'
    });
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      await realTimeSafetyAlerts.subscribeUser(user.id, updatedSettings);
      setSettings(updatedSettings);
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await realTimeSafetyAlerts.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await realTimeSafetyAlerts.dismissNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification dismissed');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <AlertCircle className="w-5 h-5" />;
      case 'medium': return <AlertCircle className="w-5 h-5" />;
      case 'low': return <AlertCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'critical': return notifications.filter(n => n.severity === 'critical');
      default: return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical').length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Loading notifications...
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Safety Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={loadNotifications}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Unread</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{unreadCount}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'critical', label: 'Critical' }
            ].map(filterOption => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === filterOption.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notification Settings
            </h3>
            
            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Enable Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive real-time safety alerts for your medications
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ enabled: !settings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notification Methods */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notification Methods</h4>
                <div className="space-y-2">
                  {[
                    { id: 'browser', label: 'Browser Notifications', icon: Smartphone },
                    { id: 'email', label: 'Email Notifications', icon: Mail },
                    { id: 'sms', label: 'SMS Notifications', icon: MessageSquare }
                  ].map(method => (
                    <label key={method.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.methods.includes(method.id as any)}
                        onChange={(e) => {
                          const newMethods = e.target.checked
                            ? [...settings.methods, method.id as any]
                            : settings.methods.filter(m => m !== method.id);
                          updateSettings({ methods: newMethods });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <method.icon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Severity Levels */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Alert Severity</h4>
                <div className="space-y-2">
                  {[
                    { id: 'low', label: 'Low Priority', color: 'text-blue-600' },
                    { id: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
                    { id: 'high', label: 'High Priority', color: 'text-orange-600' },
                    { id: 'critical', label: 'Critical Priority', color: 'text-red-600' }
                  ].map(severity => (
                    <label key={severity.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.severity.includes(severity.id as any)}
                        onChange={(e) => {
                          const newSeverity = e.target.checked
                            ? [...settings.severity, severity.id as any]
                            : settings.severity.filter(s => s !== severity.id);
                          updateSettings({ severity: newSeverity });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`ml-2 ${severity.color}`}>{severity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Quiet Hours</h4>
                  <button
                    onClick={() => updateSettings({ 
                      quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {settings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) => updateSettings({
                          quietHours: { ...settings.quietHours, start: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) => updateSettings({
                          quietHours: { ...settings.quietHours, end: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Notifications
        </h3>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              {filter === 'all' ? 'No notifications found' : `No ${filter} notifications found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-lg p-4 ${getSeverityColor(notification.severity)} ${
                  !notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/50">
                          {notification.severity.toUpperCase()}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm mb-2">{notification.message}</p>
                      <p className="text-sm font-medium mb-2">
                        Action: {notification.actionRequired}
                      </p>
                      <div className="flex items-center justify-between text-xs opacity-75">
                        <span>Source: {notification.fdaSource}</span>
                        <span>{notification.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 rounded"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
