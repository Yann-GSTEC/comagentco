// Service worker "kill switch" : se désinstalle lui-même immédiatement et force le rechargement de
// l'application. Sert à retirer proprement une version précédente de ce service worker qui aurait posé
// problème, sans manipulation technique côté utilisateur (pas besoin d'aller dans les outils développeur).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Supprime tous les caches créés par une précédente version de ce service worker.
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      // Se désenregistre lui-même : dès ce moment, le navigateur ne passera plus par un service worker.
      await self.registration.unregister();
      // Recharge chaque onglet ouvert de l'application pour repartir sur une base propre.
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((client) => client.navigate(client.url));
    })()
  );
});
