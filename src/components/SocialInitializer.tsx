import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import initSocialFeatures from '../scripts/initSocialFeatures';
import { subscriptionService } from '../lib/subscriptionService';
import { notificationService } from '../lib/notificationService';
import { useToast } from '../components/ui/Toast';

// This component initializes social features when the app starts
// It should be included in the app's main layout

const SocialInitializer: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Only run initialization once
        if (!initialized) {
          await initSocialFeatures();
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing social features:', error);
      }
    };

    initialize();
  }, [initialized]);

  useEffect(() => {
    let notificationSubscription: any = null;

    // Subscribe to notifications when user is logged in
    if (user) {
      try {
        notificationSubscription = notificationService.subscribeToNotifications(
          user.id,
          (notification) => {
            try {
              // Show a toast notification
              toast({
                title: notification.title || 'New Notification',
                description: notification.message || 'You have a new notification',
                variant: 'default',
                action: notification.link ? {
                  label: 'View',
                  onClick: () => {
                    try {
                      // Mark as read when clicked
                      notificationService.markAsRead(notification.id);

                      // Navigate to the link if provided
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    } catch (error) {
                      console.warn('Error handling notification click:', error);
                    }
                  }
                } : undefined
              });

              // Mark as read after a delay
              setTimeout(() => {
                try {
                  notificationService.markAsRead(notification.id);
                } catch (error) {
                  console.warn('Error marking notification as read:', error);
                }
              }, 10000);
            } catch (error) {
              console.warn('Error processing notification:', error);
            }
          }
        );
      } catch (error) {
        console.error('Error subscribing to notifications:', error);
      }
    }

    // Cleanup subscription when component unmounts or user changes
    return () => {
      try {
        if (notificationSubscription) {
          subscriptionService.unsubscribe(notificationSubscription);
        }
      } catch (error) {
        console.warn('Error unsubscribing from notifications:', error);
      }
    };
  }, [user, toast]);

  // This component doesn't render anything
  return null;
};

export default SocialInitializer;
