// Service Worker for CareAI PWA
const CACHE_NAME = 'careai-cache-v3';
const OFFLINE_URL = '/offline.html';

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' ||
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname === '[::1]';

// Core assets to cache (Vite build compatible)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// Assets to skip caching (problematic files)
const SKIP_CACHE_PATTERNS = [
  '/sounds/',
  '/assets/sounds/',
  '.mp3',
  '.wav',
  '.ogg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        // Cache core assets one by one to avoid failures
        return Promise.allSettled(
          CORE_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Core assets cached, skipping waiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // In development mode, be more aggressive about skipping requests
  if (isDevelopment) {
    // Skip all WebSocket connections and HMR requests
    if (event.request.url.includes('ws://') ||
        event.request.url.includes('wss://') ||
        event.request.url.includes('__vite_ping') ||
        event.request.url.includes('/@vite/') ||
        event.request.url.includes('/@fs/') ||
        event.request.url.includes('/node_modules/') ||
        event.request.url.includes('?import') ||
        event.request.url.includes('?direct') ||
        event.request.url.includes('.ts?') ||
        event.request.url.includes('.tsx?') ||
        event.request.url.includes('hot-update')) {
      return;
    }
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip development server requests
  if (event.request.url.includes('browser-sync') ||
      event.request.url.includes('vite') ||
      event.request.url.includes('__vite') ||
      event.request.url.includes('@vite') ||
      event.request.url.includes('sockjs-node') ||
      event.request.url.includes('webpack-dev-server')) {
    return;
  }

  // Skip API requests and Firebase requests
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  // Skip audio files and other problematic assets
  if (SKIP_CACHE_PATTERNS.some(pattern => event.request.url.includes(pattern))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request
        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response (don't await to avoid blocking)
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache).catch(err => {
                  console.warn('[SW] Failed to cache:', event.request.url, err);
                });
              })
              .catch(err => {
                console.warn('[SW] Failed to open cache:', err);
              });

            return response;
          })
          .catch((error) => {
            console.log('[SW] Network request failed:', event.request.url, error);
            // If offline and requesting a page, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // For other requests, try to return a cached version or return undefined
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return a proper Response object for failed requests
              return new Response('', {
                status: 404,
                statusText: 'Not Found'
              });
            });
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-health-data') {
    event.waitUntil(syncHealthData());
  }
});

// Function to sync health data when back online
async function syncHealthData() {
  try {
    const db = await openDB('careai-offline-db', 1);
    const offlineData = await db.getAll('offlineData');
    
    if (offlineData.length === 0) {
      return;
    }
    
    // Process each offline data entry
    for (const data of offlineData) {
      try {
        const response = await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
        
        if (response.ok) {
          // If successfully synced, remove from offline storage
          await db.delete('offlineData', data.id);
        }
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    }
  } catch (error) {
    console.error('Error accessing offline database:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
