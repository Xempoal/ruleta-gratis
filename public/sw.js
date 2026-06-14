/* Service worker de Ruleta de Sorteos.
   Permite abrir la app sin conexión una vez visitada.
   Sube el número de versión para forzar una actualización. */
const VERSION = 'ruleta-v1'
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then(async (cache) => {
        await cache.addAll(CORE)
        // Lee el index para precachear los assets reales (nombres con hash)
        try {
          const res = await fetch('/index.html', { cache: 'no-cache' })
          const html = await res.text()
          await cache.put('/index.html', new Response(html, { headers: { 'Content-Type': 'text/html' } }))
          const urls = [...new Set(html.match(/\/assets\/[A-Za-z0-9_.-]+/g) || [])]
          await cache.addAll(urls)
        } catch (e) {
          /* sin conexión durante la instalación: se cacheará al vuelo */
        }
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  // Navegaciones (cargar la página): red primero, cae a la copia en caché.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Recursos (JS/CSS/íconos con nombre único): caché primero, si no, red y se guarda.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(req, copy))
          return res
        }),
    ),
  )
})
