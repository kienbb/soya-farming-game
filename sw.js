const CACHE_NAME = 'soya-game-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './confetti.js',
  './manifest.json',
  './assets/fami.svg',
  './assets/bean.svg',
  './assets/omega3.svg',
  './assets/asam.svg',
  './assets/xo.svg',
  './assets/beo-tot.svg',
  './assets/dam-tot.svg',
  './assets/xo-tot.svg'
];

// Service worker install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Service worker fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch new
        return response || fetch(event.request)
          .then(response => {
            // Only cache successful responses from our origin
            if (response.ok && event.request.url.startsWith(self.location.origin)) {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, response.clone());
                  return response;
                });
            }
            return response;
          });
      })
      .catch(() => {
        // Return offline page or fallback content for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline mode - Please check your connection');
      })
  );
});

// Service worker activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Handle offline functionality
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
