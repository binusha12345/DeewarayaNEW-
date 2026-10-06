import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.mp4'],

  server: {
    host: '0.0.0.0',  // CHANGED - listens on ALL network interfaces
    port: 5173,
    strictPort: true,  // Fails if port busy instead of switching
    https: {
      key: fs.readFileSync('./10.57.89.85+2-key.pem'),
      cert: fs.readFileSync('./10.57.89.85+2.pem'),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})