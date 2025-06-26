// Register the Firebase messaging service worker
export const registerFirebaseServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Firebase SW Registration] Checking for Firebase service worker file');

      // Check if the service worker file exists before trying to register it
      try {
        const response = await fetch('/firebase-messaging-sw.js', { cache: 'no-cache' });
        if (!response.ok) {
          console.error('[Firebase SW Registration] Firebase service worker file not found or not accessible:', response.status);
          return null;
        }
        console.log('[Firebase SW Registration] Firebase service worker file found');
      } catch (fetchError) {
        console.error('[Firebase SW Registration] Error checking for service worker file:', fetchError);
        return null;
      }

      // Check if there's already a service worker registered
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      if (existingRegistration) {
        console.log('[Firebase SW Registration] Existing service worker found, using it for Firebase messaging');
        return existingRegistration;
      }

      // Register the Firebase service worker with a different scope to avoid conflicts
      console.log('[Firebase SW Registration] Registering Firebase messaging service worker');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-sw/'
      });

      console.log('Firebase Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('Service workers are not supported in this browser');
    return null;
  }
};

// Check if Firebase service worker is already registered
export const getFirebaseServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes('/') && registration.active) {
          if (registration.active.scriptURL.includes('firebase-messaging-sw.js')) {
            console.log('Found existing Firebase service worker');

            // Check if the service worker is active
            if (registration.active.state === 'activated') {
              return registration;
            } else {
              console.log('Firebase service worker is registered but not activated, waiting for activation');
              // Wait for the service worker to become active
              return new Promise((resolve) => {
                registration.active?.addEventListener('statechange', (e) => {
                  if ((e.target as ServiceWorker).state === 'activated') {
                    resolve(registration);
                  }
                });

                // Set a timeout to avoid hanging indefinitely
                setTimeout(() => {
                  console.log('Timeout waiting for service worker activation, proceeding anyway');
                  resolve(registration);
                }, 3000);
              });
            }
          }
        }
      }

      // If no existing registration found, register a new one
      return await registerFirebaseServiceWorker();
    } catch (error) {
      console.error('Error checking for Firebase service worker:', error);
      return null;
    }
  }

  return null;
};
