const CACHE_VERSION = 'v1';
const CACHE_NAME = `todo-pwa-${CACHE_VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/assets/styles.css',
  '/scripts/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Stale-while-revalidate for same-origin GET requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return; // bypass
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    const networkPromise = fetch(request).then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => undefined);

    return cached || networkPromise || (await cache.match('/index.html'));
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

