/**
 * Gym Tracker Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'gym-tracker-v2026-01-10-01';
const urlsToCache = [
  '/',
  '/gym-tracker.html',
  '/index.html'
];

// Install event - cache files
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[SW] Cache addAll error (some files may be missing):', err);
        // Niet fataal - continue zonder deze files
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache first strategy with network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls if any (we're fully offline-first)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        console.log('[SW] Serving from cache:', event.request.url);
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(response => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the new response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(error => {
        console.log('[SW] Fetch failed, returning cached:', event.request.url);
        
        // Return cached version or offline page
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          // Return offline fallback if available
          if (event.request.destination === 'document') {
            return caches.match('/gym-tracker.html') || caches.match('/index.html');
          }
        });
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded and ready');
