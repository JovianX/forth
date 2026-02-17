const CACHE_NAME = 'forth-v2';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Get base path from scope
const getBasePath = () => {
  const scope = self.registration?.scope || self.location.pathname.replace(/\/sw\.js$/, '');
  return scope.endsWith('/') ? scope : scope + '/';
};

const BASE_PATH = getBasePath();

// Install event - cache resources (non-blocking)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Try to cache main resources, but don't fail if some are missing
        return Promise.allSettled([
          cache.add(BASE_PATH),
          cache.add(BASE_PATH + 'index.html'),
        ]).then(() => {
          console.log('Service Worker cache initialized with base path:', BASE_PATH);
        });
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' || url.pathname.endsWith('.html');
  
  if (isHTML) {
    // Network first for HTML files to get latest asset references
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh HTML (Cache API only supports GET requests)
          if (event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // Cache first for assets (JS, CSS, images, etc.)
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request).then((fetchResponse) => {
            // Cache the new asset (Cache API only supports GET requests)
            if (event.request.method === 'GET') {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return fetchResponse;
          });
        })
        .catch(() => {
          // If both fail, return offline page or fallback
          if (event.request.destination === 'document') {
            return caches.match(BASE_PATH + 'index.html');
          }
        })
    );
  }
});
