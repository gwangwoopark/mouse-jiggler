// Service Worker for Mouse Jiggler PWA
const CACHE_NAME = 'mouse-jiggler-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/faq.html',
  '/css/style.css',
  '/css/policy.css',
  '/js/LanguageManager.js',
  '/js/UIController.js',
  '/js/GridRenderer.js',
  '/js/AnimationController.js',
  '/js/TimingManager.js',
  '/js/MouseJiggler.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SW: All resources cached');
        return self.skipWaiting(); // 즉시 활성화
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Service Worker activated');
      return self.clients.claim(); // 모든 클라이언트 제어
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('SW: Serving from cache:', event.request.url);
          return response;
        }
        
        // Otherwise fetch from network
        console.log('SW: Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for HTML pages
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background Sync (optional - for future features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('SW: Background sync triggered');
  }
});

// Push notification handler (optional - for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Mouse Jiggler';
    const options = {
      body: data.body || 'Mouse Jiggler notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'mouse-jiggler'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});