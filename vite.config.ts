import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  // Rutas relativas + build de un solo archivo: dist/index.html lleva todo el
  // JS y CSS incrustado, así funciona en cualquier hosting estático e incluso
  // abriéndolo directamente con doble clic (file://).
  base: './',
  plugins: [react(), viteSingleFile()],
})
