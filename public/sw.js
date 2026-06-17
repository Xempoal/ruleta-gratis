/* PWA DESACTIVADA.
   Este service worker ya no cachea nada: se autodesregistra y borra las cachés
   para que los navegadores que tenían la versión anterior instalada vuelvan a
   cargar el sitio normal desde la red. No volver a registrar service workers. */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch (e) {
        /* sin cachés que borrar */
      }
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.navigate(c.url))
    })(),
  )
})
