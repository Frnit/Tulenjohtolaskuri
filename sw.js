const CACHE_NAME = 'tj-laskuri-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/adapters/storage.js',
  './src/persistence/repository.js',
  './src/app/state.js'
];

// Asennus: Tallenna tiedostot välimuistiin
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Haku: Käytä välimuistia jos mahdollista (Offline first)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
