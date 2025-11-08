const CACHE_NAME = 'berbagi-cerita-v1';
const ASSETS_CACHE = 'assets-v1';
const API_CACHE = 'api-cache-v1';

// Assets to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== ASSETS_CACHE && cache !== API_CACHE) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Stale-While-Revalidate for API, Cache First for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API Requests - Stale-While-Revalidate
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            // Only cache GET requests
            if (request.method === 'GET') {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // If fetch fails and no cache, return offline response
            return cachedResponse || new Response(JSON.stringify({
              error: true,
              message: 'Offline - Data tidak tersedia'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });

          // Return cached response immediately if available, fetch in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Static Assets - Cache First
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((fetchResponse) => {
        return caches.open(ASSETS_CACHE).then((cache) => {
          cache.put(request, fetchResponse.clone());
          return fetchResponse;
        });
      }).catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Notification Received');
  
  let notificationData = {
    title: 'Berbagi Cerita',
    body: 'Ada cerita baru!',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    data: {
      url: '/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        title: pushData.title || notificationData.title,
        body: pushData.body || pushData.message || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: notificationData.badge,
        data: {
          url: pushData.url || '/',
          storyId: pushData.storyId
        },
        actions: [
          {
            action: 'open',
            title: 'Lihat Cerita'
          },
          {
            action: 'close',
            title: 'Tutup'
          }
        ]
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: [200, 100, 200],
      tag: 'story-notification'
    })
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync');
  
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncStories());
  }
});

async function syncStories() {
  // This will be implemented in the IndexedDB section
  console.log('Syncing offline stories...');
  
  // Get offline stories from IndexedDB
  // Send them to API
  // Clear from IndexedDB if successful
  
  return Promise.resolve();
}