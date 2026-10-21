const CACHE_NAME = 'istqb-images-v1';
const IMAGE_URLS = [
  './assets/diagrams/A_23.webp',
  './assets/diagrams/B_23.webp',
  './assets/diagrams/C_23.webp',
  './assets/diagrams/C_24.webp',
  './assets/diagrams/C_31.webp',
  './assets/diagrams/C_32.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(IMAGE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // App pages always come from the network so a deployment is never hidden by a stale browser cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  if (event.request.method !== 'GET' || !event.request.url.includes('/assets/diagrams/')) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(event.request);
    const refresh = fetch(event.request).then(response => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    });
    return cached || refresh;
  }));
});
