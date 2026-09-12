importScripts('./src/pwa/release.js');

const RELEASE = self.TJL_RELEASE;
const CACHE_PREFIX = 'tjl-core-';
const CACHE_NAME = RELEASE.cacheName;
const CORE_ASSETS = RELEASE.assets;

async function notifyClients(message) {
  const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
  windows.forEach(client => client.postMessage(message));
}

async function installRelease() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    const entries = await Promise.all(CORE_ASSETS.map(asset => cache.match(asset)));
    if (entries.some(entry => !entry)) throw new Error('Incomplete offline core');
    await notifyClients({type: 'TJL_UPDATE_READY', release: RELEASE});
  } catch (error) {
    await caches.delete(CACHE_NAME);
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(installRelease());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
    await notifyClients({type: 'TJL_RELEASE_ACTIVE', release: RELEASE});
  })());
});

self.addEventListener('message', event => {
  const message = event.data || {};
  if (message.type !== 'TJL_ACTIVATE_UPDATE') return;
  event.waitUntil((async () => {
    await notifyClients({type: 'TJL_UPDATE_ACTIVATING', release: RELEASE});
    await self.skipWaiting();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(event.request, {ignoreSearch: true});
    return response || fetch(event.request);
  })());
});
