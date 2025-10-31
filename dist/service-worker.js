/* PsySymbol Service Worker (Phase 2.1) */
const VERSION = 'psysymbol-v2-1-001';
const STATIC_CACHE = `${VERSION}-static`;
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // Cache-first for same-origin static files
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(resp => {
        // Optionally cache new static responses
        if (resp.ok && (request.destination === 'document' || request.destination === 'style' || request.destination === 'script' || request.destination === 'image')) {
          const clone = resp.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
        }
        return resp;
      }).catch(() => caches.match('./')))
    );
    return;
  }

  // For Wikipedia / Numbers API: network-first with fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
