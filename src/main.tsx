import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA desactivada: el sitio ya NO se puede instalar ni funciona sin conexión.
// Limpiamos cualquier service worker y caché que hubieran quedado de versiones
// anteriores para que los visitantes que ya lo tenían vuelvan a la web normal.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {})
}
if (typeof caches !== 'undefined') {
  caches
    .keys()
    .then((keys) => keys.forEach((k) => caches.delete(k)))
    .catch(() => {})
}
