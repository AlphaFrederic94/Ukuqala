// Firebase Messaging Service Worker
// This service worker handles Firebase Cloud Messaging (FCM) background messages
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.

console.log('[Firebase SW] Loading Firebase scripts');

try {
  importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');
  console.log('[Firebase SW] Firebase scripts loaded successfully');
} catch (error) {
  console.error('[Firebase SW] Error loading Firebase scripts:', error);
}

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object

console.log('[Firebase SW] Initializing Firebase app');

try {
  firebase.initializeApp({
    apiKey: "AIzaSyCpaH2_eU4sBYwoJU7dUUhaWLcoOQdfkz0",
    authDomain: "careaiproto.firebaseapp.com",
    projectId: "careaiproto",
    storageBucket: "careaiproto.firebasestorage.app",
    messagingSenderId: "521435078556",
    appId: "1:521435078556:web:5833977c31e66e4dcab259",
    measurementId: "G-5DRH8ZLEXP"
  });

  // Retrieve an instance of Firebase Messaging so that it can handle background
  // messages.
  const messaging = firebase.messaging();
  console.log('[Firebase SW] Firebase messaging initialized successfully');
} catch (error) {
  console.error('[Firebase SW] Error initializing Firebase:', error);
}

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  try {
    // Customize notification here
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/logo192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click: ', event);

  try {
    event.notification.close();

    // Get the notification data if available
    const notificationData = event.notification.data || {};
    // Default to social page if no specific URL is provided
    const targetUrl = notificationData.url || '/social';

    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then((clientList) => {
        // Try to find an existing window to focus
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }

        return null;
      })
      .catch(error => {
        console.error('[firebase-messaging-sw.js] Error handling notification click:', error);
      })
    );
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error in notification click handler:', error);
  }
});
