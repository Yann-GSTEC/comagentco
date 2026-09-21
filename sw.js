// Service worker de ComAgentCo.
// Stratégie : "réseau d'abord" pour les fichiers de l'application elle-même — en ligne, on va toujours
// chercher la dernière version déposée sur GitHub Pages (vos mises à jour s'appliquent donc
// automatiquement, sans réinstallation). Hors ligne, on retombe sur la dernière version en cache.
// IMPORTANT : ce service worker ne touche QU'AUX fichiers hébergés sur ce même site (index.html,
// manifest, icônes). Toute requête vers un autre site (bibliothèques CDN, Microsoft Graph, lien .ics,
// etc.) n'est jamais interceptée et suit son chemin normal, sans passer par ce cache.
const CACHE_NAME = 'comagentco-cache-v4';
const CORE_ASSETS = [
  './',
  './index.html',
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
  // On laisse passer, sans y toucher, toute requête qui ne vise pas ce même site (CDN, Microsoft Graph,
  // agenda .ics…) : ne pas appeler respondWith() ici revient à laisser le navigateur la traiter normalement.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
