/* Service worker de la Ruleta (PWA).
   Estrategia: red primero con respaldo en caché.
   - La app siempre intenta cargar la versión más nueva de internet.
   - Si no hay conexión, sirve la última copia guardada (funciona offline).
   - Las llamadas a /api/ NUNCA se cachean (datos en vivo de los sorteos). */

const CACHE = 'ruleta-v1'
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Datos en vivo: siempre a la red, jamás al caché
  if (url.pathname.startsWith('/api/')) return

  // Solo cacheamos nuestro propio origen (fuentes de Google van directo a red)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      try {
        const fresh = await fetch(req)
        if (fresh.ok) cache.put(req, fresh.clone())
        return fresh
      } catch {
        const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' })
        if (cached) return cached
        if (req.mode === 'navigate') {
          const home = await cache.match('/')
          if (home) return home
        }
        return Response.error()
      }
    })(),
  )
})
