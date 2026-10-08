/* Increment this cache version whenever the app shell or icons change. */
const CACHE_NAME = 'cobrinha-3310-static-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
const base = self.registration.scope;
const assetURLs = new Set(ASSETS.map(path => new URL(path, base).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('cobrinha-3310-static-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  url.search = '';
  if (!assetURLs.has(url.href)) return;
  const navigation = request.mode === 'navigate';
  const freshFirst = navigation || url.pathname.endsWith('manifest.webmanifest');
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url.href);
    if (!freshFirst && cached) return cached;
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      // Never overwrite the game shell with sign-in redirects or failures.
      if (response.ok && !response.redirected) {
        await cache.put(url.href, response.clone());
        return response;
      }
      if (cached) return cached;
      return response;
    } catch (error) {
      if (cached) return cached;
      if (navigation) {
        const shell = await cache.match(new URL('./index.html', base).href);
        if (shell) return shell;
      }
      throw error;
    }
  })());
});

