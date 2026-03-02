import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    host: true,
    cors: true,
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': 'frame-ancestors \'self\'; frame-src \'self\'',
      'X-Content-Type-Options': 'nosniff'
    }
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000
  }
})
