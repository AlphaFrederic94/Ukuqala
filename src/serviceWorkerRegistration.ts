// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(import.meta.env.VITE_PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      console.warn('Service worker not registered: PUBLIC_URL is on a different origin');
      return;
    }

    // In development mode, delay service worker registration to avoid conflicts with HMR
    const registrationDelay = isLocalhost ? 2000 : 0;

    setTimeout(() => {
      window.addEventListener('load', () => {
        const swUrl = `${import.meta.env.VITE_PUBLIC_URL || ''}/service-worker.js`;

        // Always check for valid service worker first
        checkValidServiceWorker(swUrl, config);

        // Add logging for development
        if (isLocalhost) {
          navigator.serviceWorker.ready.then(() => {
            console.log(
              '[SW Registration] This web app is being served cache-first by a service worker.'
            );
          }).catch(err => {
            console.error('[SW Registration] Service worker ready failed:', err);
          });
        }
      });
    }, registrationDelay);
  } else {
    console.warn('Service workers are not supported in this browser');
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  console.log('[SW Registration] Attempting to register service worker:', swUrl);

  navigator.serviceWorker
    .register(swUrl, {
      scope: '/'
    })
    .then((registration) => {
      console.log('[SW Registration] Service worker registered successfully:', registration);

      registration.onupdatefound = () => {
        console.log('[SW Registration] Service worker update found');
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          console.log('[SW Registration] Installing worker state:', installingWorker.state);
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('[SW Registration] New content is available and will be used when all tabs are closed');

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('[SW Registration] Content is cached for offline use');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW Registration] Error during service worker registration:', error);
      // Don't throw the error, just log it to prevent app crashes
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  console.log('[SW Registration] Checking for valid service worker:', swUrl);

  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
    cache: 'no-cache'
  })
    .then((response) => {
      console.log('[SW Registration] Service worker fetch response:', response.status, response.statusText);

      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        console.warn('[SW Registration] No valid service worker found. Unregistering existing workers.');
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            console.log('[SW Registration] Service worker unregistered, reloading page');
            window.location.reload();
          });
        }).catch(err => {
          console.error('[SW Registration] Error unregistering service worker:', err);
          // Still try to register the new one
          registerValidSW(swUrl, config);
        });
      } else {
        // Service worker found. Proceed as normal.
        console.log('[SW Registration] Valid service worker found, proceeding with registration');
        registerValidSW(swUrl, config);
      }
    })
    .catch((error) => {
      console.log('[SW Registration] No internet connection found or service worker fetch failed:', error);
      console.log('[SW Registration] App may be running in offline mode');
      // Still try to register the service worker in case it's cached
      registerValidSW(swUrl, config);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Function to request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Function to subscribe to push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if push manager is supported
    if (!registration.pushManager) {
      console.log('Push notifications not supported');
      return null;
    }

    // Get the subscription
    let subscription = await registration.pushManager.getSubscription();

    // If no subscription, create one
    if (!subscription) {
      // Get the server's public key
      const response = await fetch('/api/push/public-key');
      const { publicKey } = await response.json();

      // Convert the public key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
