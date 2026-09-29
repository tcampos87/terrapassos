// Service worker do TerraPassos — cache "stale-while-revalidate" só para o
// próprio ficheiro da app (mesma origem). Pedidos a APIs externas (previsão
// do tempo, fotos da Wikipédia) passam sempre direto para a rede: a app já
// trata a falta de ligação de forma graciosa nesses casos.
const CACHE_NAME = 'terrapassos-v11';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req).then(res => {
        if(res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
