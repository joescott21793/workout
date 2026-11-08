// Network first so updates show up right away; falls back to the cached copy
// when offline or when the gym's signal takes longer than 4 seconds.
const CACHE = 'workout-v2';
const DEMOS = ['db-press-flat', 'db-incline-press', 'cable-fly', 'seated-db-shoulder-press', 'cable-rope-pushdown',
  'single-arm-cable-tricep-pulldown', 'lat-pulldown', 'row-machine', 'one-arm-db-row', 'cable-face-pull', 'db-curl',
  'cable-hammer-curl', 'horizontal-leg-press', 'db-bulgarian-split-squat', 'db-romanian-deadlift',
  'leg-press-calf-raise', 'cable-glute-kickback', 'cable-crunch', 'plank'];
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  ...DEMOS.flatMap(k => [`./demos/${k}-0.jpg`, `./demos/${k}-1.jpg`])];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(no, 4000))]);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./')) || Response.error();
    }
  })());
});
