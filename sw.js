/* Service worker: network-first with cache fallback.
   Fresh code always wins when online; full app works offline. */
const CACHE = 'tracker-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/styles.css',
  './fonts/sora-latin.woff2',
  './fonts/jetbrains-mono-latin.woff2',
  './fonts/jetbrains-mono-cyrillic.woff2',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/config.js',
  './js/storage.js',
  './js/state.js',
  './js/ui.js',
  './js/points.js',
  './js/food.js',
  './js/tasks.js',
  './js/budget.js',
  './js/goals.js',
  './js/stats.js',
  './js/shop.js',
  './js/gym.js',
  './js/narrator.js',
  './js/backup.js',
  './js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then(r => r || caches.match('./index.html'))
      )
  );
});
