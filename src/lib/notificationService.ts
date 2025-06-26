import { db } from './firebaseConfig';
import firebase from '../firebase-compat';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'medication' | 'prediction' | 'message' | 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'new_message' | 'channel_joined';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: firebase.firestore.Timestamp | Date;
  data?: any;
}

export const notificationService = {
  async getNotifications(userId: string, limit = 10): Promise<Notification[]> {
    try {
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      if (notificationsSnapshot.empty) {
        return [];
      }

      return notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    try {
      const notificationData = {
        ...notification,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('notifications').add(notificationData);

      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(e => console.error('Error playing notification sound:', e));

      return {
        id: docRef.id,
        ...notificationData,
        createdAt: new Date()
      } as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await db.collection('notifications').doc(notificationId).update({
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const batch = db.batch();
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

      notificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await db.collection('notifications').doc(notificationId).delete();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsSnapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

      return notificationsSnapshot.size;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    try {
      return db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const notification = {
                id: change.doc.id,
                ...change.doc.data(),
                createdAt: change.doc.data().createdAt?.toDate() || new Date()
              } as Notification;

              // Play notification sound
              const audio = new Audio('/sounds/notification.mp3');
              audio.play().catch(e => console.error('Error playing notification sound:', e));

              callback(notification);
            }
          });
        });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      // Return an empty unsubscribe function
      return () => {};
    }
  },

  // Notify all users about a new post
  async notifyAllAboutNewPost(post: any, currentUserId: string): Promise<boolean> {
    try {
      // Get all users except the current user
      const usersSnapshot = await db.collection('profiles')
        .where('id', '!=', currentUserId)
        .get();

      if (usersSnapshot.empty) return true;

      // Create notifications for all users
      const batch = db.batch();

      usersSnapshot.docs.forEach(doc => {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: doc.id,
          type: 'info',
          title: 'New Post',
          message: `New post from ${post.userName || 'a user'}: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`,
          isRead: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          data: {
            postId: post.id,
            userId: post.userId || currentUserId
          }
        });
      });

      await batch.commit();

      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(e => console.error('Error playing notification sound:', e));

      return true;
    } catch (error) {
      console.error('Error notifying users about new post:', error);
      return false;
    }
  }
};
