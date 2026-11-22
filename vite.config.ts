import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative Pfade, damit die App auch unter einem Unterpfad (z. B. GitHub Pages) läuft
  base: './',
  plugins: [react(), tailwindcss()],
})
