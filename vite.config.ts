import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /refund-workflow/.
  base: '/refund-workflow/',
  plugins: [react(), tailwindcss()],
})
