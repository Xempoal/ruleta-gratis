import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Rutas relativas: el build de dist/ funciona en cualquier hosting
  // e incluso abriendo dist/index.html directamente en el navegador.
  base: './',
  plugins: [react()],
})
