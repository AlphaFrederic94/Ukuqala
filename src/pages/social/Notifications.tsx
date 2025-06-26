import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import { Bell, Heart, MessageCircle, UserPlus, Star, Check, Trash2 } from 'lucide-react';

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: '1',
        type: 'like',
        user_id: 'user1',
        user_name: 'John Doe',
        user_avatar: '/images/default_user.jpg',
        content: 'liked your post',
        post_id: 'post1',
        post_preview: 'This is a great day to be alive...',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        read: false
      },
      {
        id: '2',
        type: 'comment',
        user_id: 'user2',
        user_name: 'Jane Smith',
        user_avatar: '/images/default_user.jpg',
        content: 'commented on your post',
        post_id: 'post1',
        comment_preview: 'I totally agree with you!',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false
      },
      {
        id: '3',
        type: 'follow',
        user_id: 'user3',
        user_name: 'Mike Johnson',
        user_avatar: '/images/default_user.jpg',
        content: 'started following you',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: true
      },
      {
        id: '4',
        type: 'mention',
        user_id: 'user4',
        user_name: 'Sarah Williams',
        user_avatar: '/images/default_user.jpg',
        content: 'mentioned you in a comment',
        post_id: 'post2',
        comment_preview: 'Hey @User, what do you think about this?',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        read: true
      },
      {
        id: '5',
        type: 'like',
        user_id: 'user5',
        user_name: 'David Brown',
        user_avatar: '/images/default_user.jpg',
        content: 'liked your comment',
        post_id: 'post3',
        comment_preview: 'This is really insightful!',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true
      }
    ];
    
    setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
      case 'mention':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return t('social.justNow');
    } else if (diffMin < 60) {
      return `${diffMin}${t('social.minutesAgo')}`;
    } else if (diffHour < 24) {
      return `${diffHour}${t('social.hoursAgo')}`;
    } else if (diffDay < 7) {
      return `${diffDay}${t('social.daysAgo')}`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <NewSocialLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="social-card p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Bell className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              {t('social.notifications')}
            </h1>
            
            {notifications.some(notification => !notification.read) && (
              <button 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={markAllAsRead}
              >
                {t('social.markAllAsRead')}
              </button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        {isLoading ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t('social.loadingNotifications')}</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('social.noNotifications')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {t('social.noNotificationsDescription')}
              </p>
            </div>
          </div>
        ) : (
          <div className="social-card divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 flex items-start ${notification.read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-blue-900/10'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={notification.user_avatar} 
                    alt={notification.user_name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        <span className="font-medium">{notification.user_name}</span>{' '}
                        <span className="text-gray-600 dark:text-gray-300">{notification.content}</span>
                      </p>
                      
                      {notification.comment_preview && (
                        <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                          "{notification.comment_preview}"
                        </p>
                      )}
                      
                      {notification.post_preview && !notification.comment_preview && (
                        <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                          "{notification.post_preview}"
                        </p>
                      )}
                      
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {!notification.read && (
                        <button 
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="ml-2 mt-1 flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </NewSocialLayout>
  );
};

export default Notifications;
