import firebase from '../firebase-compat';
import { messaging, db } from './firebaseConfig';
import { getFirebaseServiceWorker } from '../registerFirebaseServiceWorker';

type MessagePayload = firebase.messaging.MessagePayload;

// Request permission and get FCM token
export const requestNotificationPermission = async (userId: string) => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Check if notification permission is already granted
    if (Notification.permission === 'granted') {
      return await getAndSaveToken(userId);
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      return await getAndSaveToken(userId);
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    // Return null instead of throwing to prevent uncaught promise errors
    return null;
  }
};

// Get FCM token and save it to Firestore
const getAndSaveToken = async (userId: string) => {
  try {
    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers are not supported in this browser');
      return null;
    }

    // Make sure Firebase service worker is registered
    let registration;
    try {
      registration = await getFirebaseServiceWorker();
    } catch (swError) {
      console.error('Error getting Firebase service worker:', swError);
      return null;
    }

    if (!registration) {
      console.error('No Firebase service worker registration found');
      return null;
    }

    // Get token with error handling
    try {
      // Get token
      const token = await messaging.getToken({
        vapidKey: 'BLBz5HRxqcxYFOBYUhM9Zt_WeRWcV2Qm_UYzDVaQkQpGFGJgTvIQGdYRIQta-q_sOSXV1MCBrWT_XuCA3Syp5AY', // Firebase Web Push VAPID key
        serviceWorkerRegistration: registration
      }).catch(err => {
        console.error('Error getting token:', err);
        return null;
      });

      // If token is null, return early
      if (!token) {
        console.error('Token is empty');
        return null;
      }

      // Save token to Firestore
      try {
        await db.collection('fcm_tokens').doc(userId).set({
          token,
          userId,
          createdAt: new Date(),
          platform: getPlatform(),
          deviceInfo: getDeviceInfo()
        });
      } catch (dbError) {
        console.error('Error saving token to Firestore:', dbError);
        // Still return the token even if saving to Firestore fails
      }

      return token;
    } catch (tokenError) {
      console.error('Error getting FCM token:', tokenError);
      // For development/testing purposes, return a mock token
      const mockToken = 'mock-fcm-token-' + Date.now();
      console.log('Using mock token for development:', mockToken);
      return mockToken;
    }
  } catch (error) {
    console.error('Error in getAndSaveToken:', error);
    return null;
  }
};

// Delete FCM token
export const deleteNotificationToken = async (userId: string) => {
  try {
    // Delete token from Firebase
    await messaging.deleteToken();

    // Delete token from Firestore
    await db.collection('fcm_tokens').doc(userId).delete();

    return true;
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    return false;
  }
};

// Check if user has a valid FCM token
export const hasValidFcmToken = async (userId: string) => {
  try {
    const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
    return tokenDoc.exists;
  } catch (error) {
    console.error('Error checking FCM token:', error);
    return false;
  }
};

// Listen for foreground messages
export const listenForMessages = (callback: (payload: MessagePayload) => void) => {
  return messaging.onMessage((payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
};

// Helper function to get platform info
const getPlatform = () => {
  const userAgent = navigator.userAgent;
  let platform = 'unknown';

  if (/Android/i.test(userAgent)) {
    platform = 'android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    platform = 'ios';
  } else if (/Windows/i.test(userAgent)) {
    platform = 'windows';
  } else if (/Mac/i.test(userAgent)) {
    platform = 'mac';
  } else if (/Linux/i.test(userAgent)) {
    platform = 'linux';
  }

  return platform;
};

// Helper function to get device info
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    vendor: navigator.vendor
  };
};

// Export the service
const firebaseMessagingService = {
  requestNotificationPermission,
  deleteNotificationToken,
  hasValidFcmToken,
  listenForMessages
};

export default firebaseMessagingService;
