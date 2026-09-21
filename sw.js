// Service worker de ComAgentCo.
// Stratégie : "réseau d'abord" — en ligne, on va toujours chercher la dernière version déposée sur
// GitHub Pages (donc vos mises à jour s'appliquent automatiquement, sans réinstallation). Hors ligne,
// on retombe sur la dernière version mise en cache.
const CACHE_NAME = 'comagentco-cache-v2';
const CORE_ASSETS = [
  './comagentco.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Copie la réponse fraîche dans le cache pour le prochain accès hors-ligne.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() =>
        // Hors-ligne (ou requête échouée) : on sert la dernière version connue en cache.
        caches.match(event.request).then((cached) => cached || caches.match('./comagentco.html'))
      )
  );
});
