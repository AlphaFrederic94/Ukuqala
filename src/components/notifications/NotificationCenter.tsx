import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Trash2, Clock, Calendar, AlertTriangle, Info, CheckCircle, AlertCircle, Heart, MessageCircle, AtSign, User } from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'appointment':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'medication':
        return <Clock className="h-5 w-5 text-indigo-500" />;
      case 'prediction':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-purple-500" />;
      case 'friend_request':
        return <User className="h-5 w-5 text-green-500" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return t('common.today') + ' ' + format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return t('common.yesterday') + ' ' + format(date, 'h:mm a');
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE') + ' ' + format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce<Record<string, Notification[]>>((groups, notification) => {
    const date = new Date(notification.createdAt);
    let groupKey: string;

    if (isToday(date)) {
      groupKey = t('common.today');
    } else if (isYesterday(date)) {
      groupKey = t('common.yesterday');
    } else if (isThisWeek(date)) {
      groupKey = t('common.thisWeek');
    } else {
      groupKey = t('common.earlier');
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(notification);
    return groups;
  }, {});

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label={t('settings.notifications')}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.notifications')}
              </h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                    title={t('notifications.markAllAsRead')}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{t('notifications.markAllAsRead')}</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                    title={t('notifications.clearAll')}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{t('notifications.clearAll')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-grow">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('notifications.noNotifications')}
                  </p>
                </div>
              ) : (
                <div>
                  {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                    <div key={date}>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {date}
                      </div>
                      {dateNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                            !notification.read
                              ? 'bg-blue-50 dark:bg-blue-900/10'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="ml-3 flex-grow">
                              {notification.link ? (
                                <Link
                                  to={notification.link}
                                  className="block"
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                </Link>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                </>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            <div className="ml-3 flex-shrink-0 flex">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  title={t('notifications.markAsRead')}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                title={t('notifications.delete')}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link
                to="/notifications"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                onClick={() => setIsOpen(false)}
              >
                {t('notifications.viewAll')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
